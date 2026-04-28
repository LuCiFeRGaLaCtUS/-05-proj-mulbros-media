"""Meta-OS opportunity scanner.

Walks Supabase state (leads, outreach_events, os_events, budgets) and applies
a set of pattern detectors to produce `opportunity_reports` rows. Two audiences:

    customer — shown in the relevant OS's chat on the next run
    operator — shown to the platform operator (you) as pitch / cross-OS signals

This is v1: a small set of built-in detectors, each a function returning a
list of Report dicts. Easy to add more detectors — just write a function and
add it to DETECTORS.

Cadence: runs on-demand via `make meta-digest TENANT=<slug>`. Phase 2.5 will
add a scheduler (apps/scheduler) that runs it daily per tenant.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from platform_os import registry
from shared import config, logging as plog
from shared.db.supabase import table

log = plog.get("platform_os.opportunity")


# ---------------------------------------------------------------------------
# Report shape
# ---------------------------------------------------------------------------
@dataclass
class Report:
    tenant_id: str
    audience: str                 # "customer" | "operator"
    pattern: str
    severity: str                 # "info" | "opportunity" | "warning"
    headline: str
    body: str = ""
    os_name: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _days_ago(days: int) -> datetime:
    return _now_utc() - timedelta(days=days)


def _parse_ts(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Pattern: pipeline gap — scored leads with score >= 80 still sitting at
# status='scored' (not yet contacted).
# ---------------------------------------------------------------------------
def _pattern_pipeline_gap(tenant_id: str) -> list[Report]:
    rows = (
        table("leads")
        .select("id,name,company,score")
        .eq("tenant_id", tenant_id)
        .eq("status", "scored")
        .gte("score", 80)
        .order("score", desc=True)
        .limit(50)
        .execute()
    ).data or []
    if len(rows) < 1:
        return []
    sev = "opportunity" if len(rows) >= 3 else "info"
    top = ", ".join(f"{r.get('name') or '?'} ({r.get('company') or '?'}, {r.get('score')})"
                    for r in rows[:3])
    return [Report(
        tenant_id=tenant_id,
        os_name="sales",
        audience="customer",
        pattern="pipeline_gap",
        severity=sev,
        headline=(f"{len(rows)} high-fit lead{'s' if len(rows)!=1 else ''} ready for outreach"),
        body=(f"These {len(rows)} scored ≥80 but haven't been contacted yet: {top}"
              + ("…" if len(rows) > 3 else "")
              + ". Want me to run outbound on the top few?"),
        payload={"lead_ids": [r["id"] for r in rows], "count": len(rows)},
    )]


# ---------------------------------------------------------------------------
# Pattern: stale contacted — leads in status='contacted' for >3 days with
# no inbound reply yet. Time to bump or move on.
# ---------------------------------------------------------------------------
def _pattern_stale_contacted(tenant_id: str) -> list[Report]:
    cutoff = _days_ago(3).isoformat()
    rows = (
        table("leads")
        .select("id,name,company,updated_at")
        .eq("tenant_id", tenant_id)
        .eq("status", "contacted")
        .lt("updated_at", cutoff)
        .limit(50)
        .execute()
    ).data or []
    if not rows:
        return []
    # Get inbound events for these leads — if any arrived, they're not stale.
    inbound = (
        table("outreach_events")
        .select("lead_id")
        .eq("tenant_id", tenant_id)
        .eq("direction", "inbound")
        .in_("lead_id", [r["id"] for r in rows])
        .execute()
    ).data or []
    replied_ids = {r["lead_id"] for r in inbound}
    stale = [r for r in rows if r["id"] not in replied_ids]
    if not stale:
        return []
    return [Report(
        tenant_id=tenant_id,
        os_name="sales",
        audience="customer",
        pattern="stale_contacted",
        severity="info",
        headline=f"{len(stale)} outreach{'es' if len(stale)!=1 else ''} gone cold (>3 days, no reply)",
        body=(f"{', '.join((r.get('name') or '?') for r in stale[:3])}"
              + ("…" if len(stale) > 3 else "")
              + " — worth a bump or moving on to a break-up email."),
        payload={"lead_ids": [r["id"] for r in stale], "count": len(stale)},
    )]


# ---------------------------------------------------------------------------
# Pattern: budget / pacing warning — any external budget >80% consumed with
# >40% of period still remaining.
# ---------------------------------------------------------------------------
def _pattern_budget_warning(tenant_id: str) -> list[Report]:
    today = _now_utc().date()
    rows = (
        table("external_budgets")
        .select("*")
        .eq("tenant_id", tenant_id)
        .lte("period_start", today.isoformat())
        .gte("period_end", today.isoformat())
        .execute()
    ).data or []
    out: list[Report] = []
    for b in rows:
        limit = float(b.get("limit_value") or 0)
        consumed = float(b.get("consumed") or 0)
        if limit <= 0:
            continue
        pct = consumed / limit
        if pct < 0.80:
            continue
        start = datetime.fromisoformat(b["period_start"]).date()
        end = datetime.fromisoformat(b["period_end"]).date()
        total_days = (end - start).days + 1
        remaining_days = max(0, (end - today).days)
        period_remaining = remaining_days / total_days if total_days else 0
        if period_remaining < 0.40:
            continue  # normal end-of-period drift, not an early warning
        out.append(Report(
            tenant_id=tenant_id,
            os_name=b.get("os_name"),
            audience="customer",
            pattern="budget_warning",
            severity="warning",
            headline=f"{b['resource_key']} is {pct*100:.0f}% used with {remaining_days} days left",
            body=(f"At this pace you'll run out before the period ends. "
                  f"Upgrade the plan, slow outreach, or shift to another channel."),
            payload={
                "resource_key": b["resource_key"],
                "limit":        limit,
                "consumed":     consumed,
                "remaining_days": remaining_days,
            },
        ))
    return out


# ---------------------------------------------------------------------------
# Pattern: cross-OS pitch (operator-facing) — tenant has real Sales OS activity
# but no Marketing OS entitlement. Candidate for upsell.
# ---------------------------------------------------------------------------
def _pattern_cross_os_pitch(tenant_id: str) -> list[Report]:
    # Read the tenant's entitled OSes from config.
    try:
        tdata = config.tenant_yaml(tenant_id)
    except FileNotFoundError:
        return []
    entitled = set(tdata.get("entitled_oses") or [])
    # Count scored+ leads as a proxy for real activity.
    rows = (
        table("leads")
        .select("id", count="exact")
        .eq("tenant_id", tenant_id)
        .in_("status", ["scored", "contacted", "replied", "meeting_booked"])
        .execute()
    )
    lead_count = rows.count if rows.count is not None else len(rows.data or [])
    if lead_count < 3:
        return []  # not enough signal yet — earlier than this is noise
    out: list[Report] = []
    live = set(registry.catalog().keys())

    # Per-candidate metadata: display label + the pitch body to surface in chat.
    # `available` candidates (already shipped, just not entitled) get a stronger
    # nudge than `roadmap` ones — the operator can entitle them today.
    candidates = {
        "marketing": (
            "Marketing OS",
            "Good time to pitch — active pipeline, no nurture layer.",
        ),
        "customer_satisfaction": (
            "Customer Satisfaction OS",
            "Post-sale coverage gap — customer-facing OS would reduce churn.",
        ),
        "brief": (
            "Brief OS",
            "Already shipped and ready to entitle. They'd see daily cross-OS "
            "digests from day one — minimal setup, immediate stickiness.",
        ),
    }
    for candidate, (label, body_tail) in candidates.items():
        if candidate in entitled:
            continue
        status = "available" if candidate in live else "roadmap"
        out.append(Report(
            tenant_id=tenant_id,
            os_name=None,
            audience="operator",
            pattern="cross_os_pitch",
            severity="opportunity",
            headline=f"{tdata.get('display_name', tenant_id)}: {label} upsell candidate",
            body=(f"They have {lead_count} active leads in Sales OS but "
                  f"{candidate} is not entitled ({status}). " + body_tail),
            payload={"active_leads": lead_count, "candidate_os": candidate,
                     "candidate_status": status},
        ))
    return out


# ---------------------------------------------------------------------------
# Registry + runner
# ---------------------------------------------------------------------------
Detector = Callable[[str], list[Report]]

DETECTORS: list[Detector] = [
    _pattern_pipeline_gap,
    _pattern_stale_contacted,
    _pattern_budget_warning,
    _pattern_cross_os_pitch,
]


def _dedupe_existing(tenant_id: str, reports: list[Report]) -> list[Report]:
    """Drop reports whose (pattern, payload-key) combo already has an unacked
    row from the last 24h. Prevents duplicate alerts across repeated digest runs."""
    since = _days_ago(1).isoformat()
    existing = (
        table("opportunity_reports")
        .select("pattern,payload,acknowledged_at,created_at")
        .eq("tenant_id", tenant_id)
        .is_("acknowledged_at", "null")
        .gte("created_at", since)
        .execute()
    ).data or []
    existing_keys: set[tuple[str, str]] = set()
    for e in existing:
        p = e.get("payload") or {}
        key = (e["pattern"], str(p.get("resource_key")
                                  or p.get("candidate_os")
                                  or p.get("count") or ""))
        existing_keys.add(key)
    out: list[Report] = []
    for r in reports:
        key = (r.pattern, str(r.payload.get("resource_key")
                              or r.payload.get("candidate_os")
                              or r.payload.get("count") or ""))
        if key in existing_keys:
            continue
        out.append(r)
    return out


def run_for_tenant(tenant_id: str) -> list[Report]:
    """Execute every detector against one tenant's state, dedupe, persist."""
    all_reports: list[Report] = []
    for det in DETECTORS:
        try:
            all_reports.extend(det(tenant_id))
        except Exception as e:
            plog.event(log, "detector_failed",
                       detector=det.__name__, tenant=tenant_id, err=str(e))
    fresh = _dedupe_existing(tenant_id, all_reports)
    if not fresh:
        return []
    try:
        table("opportunity_reports").insert([
            {
                "tenant_id": r.tenant_id,
                "os_name":   r.os_name,
                "audience":  r.audience,
                "pattern":   r.pattern,
                "severity":  r.severity,
                "headline":  r.headline,
                "body":      r.body,
                "payload":   r.payload,
            }
            for r in fresh
        ]).execute()
    except Exception as e:
        plog.event(log, "opportunity.write_failed", err=str(e))
    return fresh


# ---------------------------------------------------------------------------
# Read path — for the orchestrator / chat UI to surface reports
# ---------------------------------------------------------------------------
def unacked_for_audience(tenant_id: str, audience: str, limit: int = 20) -> list[dict]:
    res = (
        table("opportunity_reports")
        .select("id,os_name,pattern,severity,headline,body,payload,created_at")
        .eq("tenant_id", tenant_id)
        .eq("audience", audience)
        .is_("acknowledged_at", "null")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []
