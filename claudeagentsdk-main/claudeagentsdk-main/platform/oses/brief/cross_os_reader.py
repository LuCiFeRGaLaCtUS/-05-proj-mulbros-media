"""Brief OS cross-OS reader.

Read-only helpers that pull tenant-scoped state from tables owned by *other*
OSes (currently just Sales OS) plus platform-shared tables. Every query goes
through `shared.db.supabase.table(...)` with explicit `.eq("tenant_id", ...)`
so tenant isolation stays explicit (RLS comes in Phase 5).

These helpers are intentionally not @governed — they're invoked by the in-
process MCP tool `get_brief_context`, which IS @governed at its boundary.
That keeps the audit trail at the tool level without double-wrapping reads.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from shared.db.supabase import table


# ---------------------------------------------------------------------------
# Pipeline (sales)
# ---------------------------------------------------------------------------
def pipeline_summary(tenant_id: str) -> dict[str, Any]:
    """Lead funnel counts + top 3 scored leads (read-only)."""
    statuses = ["new", "enriched", "scored", "contacted", "replied",
                "meeting_booked", "disqualified"]
    counts: dict[str, int] = {}
    for s in statuses:
        try:
            res = (
                table("leads").select("id", count="exact")
                .eq("tenant_id", tenant_id).eq("status", s)
                .limit(1).execute()
            )
            counts[s] = res.count or 0
        except Exception:
            counts[s] = 0

    try:
        top = (
            table("leads")
            .select("name,company,title,score,status")
            .eq("tenant_id", tenant_id)
            .gte("score", 0)
            .order("score", desc=True)
            .limit(3)
            .execute()
        ).data or []
    except Exception:
        top = []

    return {"counts": counts, "top_scored": top}


# ---------------------------------------------------------------------------
# Opportunities (platform meta-OS scanner)
# ---------------------------------------------------------------------------
def recent_opportunities(tenant_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """Last N customer-audience, unacked opportunity reports across all OSes."""
    try:
        res = (
            table("opportunity_reports")
            .select("os_name,pattern,severity,headline,body,created_at")
            .eq("tenant_id", tenant_id)
            .eq("audience", "customer")
            .is_("acknowledged_at", "null")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Budgets (platform-shared external_budgets)
# ---------------------------------------------------------------------------
def budget_status(tenant_id: str) -> list[dict[str, Any]]:
    """Active-period budgets with consumed-vs-limit + pct."""
    today = date.today().isoformat()
    try:
        rows = (
            table("external_budgets")
            .select("os_name,resource_key,period,limit_value,consumed,period_start,period_end")
            .eq("tenant_id", tenant_id)
            .lte("period_start", today)
            .gte("period_end", today)
            .execute()
        ).data or []
    except Exception:
        return []
    out: list[dict[str, Any]] = []
    for b in rows:
        lim = float(b.get("limit_value") or 0)
        cons = float(b.get("consumed") or 0)
        out.append({
            "os_name": b.get("os_name"),
            "resource_key": b.get("resource_key"),
            "period": b.get("period"),
            "limit_value": lim,
            "consumed": cons,
            "remaining": max(0.0, lim - cons),
            "pct": (cons / lim) if lim > 0 else 0.0,
        })
    return out


# ---------------------------------------------------------------------------
# Outreach (sales)
# ---------------------------------------------------------------------------
def outreach_recent(tenant_id: str, hours: int = 24) -> list[dict[str, Any]]:
    """Outreach events in the last N hours (default 24), newest first."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    try:
        res = (
            table("outreach_events")
            .select("channel,direction,subject,status,ts,sandbox")
            .eq("tenant_id", tenant_id)
            .gte("ts", cutoff)
            .order("ts", desc=True)
            .limit(20)
            .execute()
        )
        return res.data or []
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Aggregator — single call shape consumed by the briefer
# ---------------------------------------------------------------------------
def gather(tenant_id: str) -> dict[str, Any]:
    """Single call returning everything the briefer might consult. The agent
    decides which subsections to render based on the tenant's `sections`
    config — we give it the full set."""
    return {
        "pipeline_summary": pipeline_summary(tenant_id),
        "recent_opportunities": recent_opportunities(tenant_id),
        "budget_status": budget_status(tenant_id),
        "outreach_recent": outreach_recent(tenant_id),
    }
