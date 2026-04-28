"""Cadence scheduler helpers — schedule/query/cancel/mark operations over
`outreach_schedule`.

The default 4-touch cadence (from the `cold-email-follow-up` skill) is:
    touch 1 — first-touch         (handled by BDR's main flow, not scheduled)
    touch 2 — bump      (+3 business days)
    touch 3 — value     (+5 business days from touch 1)
    touch 4 — break-up  (+7 business days from touch 1)

Business-day math is naive (skip Sat/Sun) — that's enough for v1. Holidays
etc. can be layered later.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from shared import logging as plog
from shared.db.supabase import client, table

log = plog.get("shared.db.cadence")


# ---------------------------------------------------------------------------
# Default cadence template
# ---------------------------------------------------------------------------
@dataclass
class TouchSpec:
    touch_number: int
    pattern: str
    offset_business_days: int


DEFAULT_CADENCE: list[TouchSpec] = [
    TouchSpec(touch_number=2, pattern="bump",     offset_business_days=3),
    TouchSpec(touch_number=3, pattern="value",    offset_business_days=5),
    TouchSpec(touch_number=4, pattern="break_up", offset_business_days=7),
]


# ---------------------------------------------------------------------------
# Business-day math (skip Sat/Sun)
# ---------------------------------------------------------------------------
def add_business_days(start: datetime, days: int) -> datetime:
    d = start
    remaining = days
    while remaining > 0:
        d = d + timedelta(days=1)
        if d.weekday() < 5:   # Mon-Fri
            remaining -= 1
    return d


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------
def schedule_cadence(
    *,
    tenant_id: str,
    lead_id: str,
    channel: str = "email",
    anchor: datetime | None = None,
    template: list[TouchSpec] | None = None,
) -> list[dict]:
    """Insert pending rows for every non-first touch in the template.

    Returns the inserted rows. Safe to call multiple times for the same lead
    — uses a fresh `cadence_id` each call, so repeat invocations produce
    additional scheduled chains (useful when we ever need to re-engage). If
    you want idempotency, call `cancel_for_lead()` first.
    """
    if anchor is None:
        anchor = datetime.now(timezone.utc)
    template = template or DEFAULT_CADENCE
    cadence_id = str(uuid.uuid4())
    rows: list[dict] = []
    for t in template:
        when = add_business_days(anchor, t.offset_business_days)
        rows.append({
            "tenant_id":     tenant_id,
            "lead_id":       lead_id,
            "cadence_id":    cadence_id,
            "touch_number":  t.touch_number,
            "pattern":       t.pattern,
            "channel":       channel,
            "scheduled_for": when.isoformat(),
            "status":        "pending",
        })
    try:
        res = client().table("outreach_schedule").insert(rows).execute()
        return res.data or []
    except Exception as e:
        plog.event(log, "cadence.schedule_failed", lead_id=lead_id, err=str(e))
        return []


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------
def list_due(tenant_id: str | None = None, limit: int = 100) -> list[dict]:
    """Return pending rows whose scheduled_for is in the past, oldest first."""
    now = datetime.now(timezone.utc).isoformat()
    q = (
        table("outreach_schedule")
        .select("id,tenant_id,lead_id,cadence_id,touch_number,pattern,channel,scheduled_for")
        .eq("status", "pending")
        .lte("scheduled_for", now)
    )
    if tenant_id:
        q = q.eq("tenant_id", tenant_id)
    return (q.order("scheduled_for").limit(limit).execute()).data or []


def list_pending_for_lead(tenant_id: str, lead_id: str) -> list[dict]:
    res = (
        table("outreach_schedule")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("lead_id", lead_id)
        .eq("status", "pending")
        .order("scheduled_for")
        .execute()
    )
    return res.data or []


def list_upcoming(tenant_id: str, limit: int = 25) -> list[dict]:
    """For the dashboard: pending rows ordered by when."""
    res = (
        table("outreach_schedule")
        .select("id,lead_id,touch_number,pattern,channel,scheduled_for,status")
        .eq("tenant_id", tenant_id)
        .eq("status", "pending")
        .order("scheduled_for")
        .limit(limit)
        .execute()
    )
    return res.data or []


# ---------------------------------------------------------------------------
# Mutate
# ---------------------------------------------------------------------------
def cancel_for_lead(tenant_id: str, lead_id: str, reason: str = "lead replied") -> int:
    """Cancel all pending cadence rows for a lead (called on inbound reply
    or manual disqualification). Returns the count cancelled."""
    res = (
        table("outreach_schedule")
        .update({"status": "cancelled", "reason": reason})
        .eq("tenant_id", tenant_id)
        .eq("lead_id", lead_id)
        .eq("status", "pending")
        .execute()
    )
    n = len(res.data or [])
    if n:
        plog.event(log, "cadence.cancelled", lead_id=lead_id, count=n, reason=reason)
    return n


def mark_sent(row_id: str) -> None:
    table("outreach_schedule").update({
        "status": "sent",
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", row_id).execute()


def mark_failed(row_id: str, reason: str) -> None:
    table("outreach_schedule").update({
        "status":  "failed",
        "reason":  reason,
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", row_id).execute()


# ---------------------------------------------------------------------------
# Brief construction — the natural-language kick the orchestrator receives
# ---------------------------------------------------------------------------
def build_touch_brief(row: dict[str, Any]) -> str:
    """Compose the brief that the scheduler fires at the orchestrator when a
    pending touch becomes due. Explicit about which touch + which pattern so
    BDR picks the right cold-email-follow-up variant."""
    patterns = {
        "bump":    ("BUMP", "≤40 words, threaded on the original subject line "
                            "('Re: ...'), add ONE new angle. Never 'just following up'."),
        "value":   ("VALUE", "Share something useful (a short case study, a peer quote, "
                             "a 1-page guide). No CTA — the whole email is useful even if they ignore you. ≤80 words."),
        "break_up":("BREAK-UP", "Graceful stop: 'Sounds like now isn't the right time — "
                                "I'll pause here. If something changes, feel free to reach out.' ≤30 words."),
    }
    label, guidance = patterns.get(row.get("pattern", ""), ("FOLLOW-UP", "Apply the cold-email-follow-up skill."))
    return (
        f"Run outbound touch #{row['touch_number']} ({label}) to lead_id={row['lead_id']}.\n\n"
        f"Context: they received our first-touch email at least a few business days ago "
        f"and haven't replied. Apply the `cold-email-follow-up` skill, specifically the "
        f"{label} pattern: {guidance}\n\n"
        f"Send via `send_email` (channel={row['channel']}). "
        f"After sending, do NOT schedule more follow-ups — this touch was already on the "
        f"scheduler. If the send fails, do NOT update lead status.\n\n"
        f"This touch's scheduler_row_id={row['id']} — you don't need to reference it; "
        f"the scheduler tracks the outcome separately."
    )
