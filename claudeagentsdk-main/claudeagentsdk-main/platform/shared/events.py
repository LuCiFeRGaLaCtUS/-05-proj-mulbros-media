"""Event emitter — writes rows to `os_events`.

The meta-OS opportunity bus reads this table to detect patterns worth
surfacing to the customer or the operator. Agents emit at key transitions
(lead.sourced, lead.scored, outreach.sent) and the scanner reasons over
the resulting timeline.

Events are fire-and-forget: a failure to write is logged but never breaks
the caller. Losing a single event doesn't corrupt state (the operational
data in `leads` / `outreach_events` is the source of truth).
"""
from __future__ import annotations

from typing import Any

from shared import logging as plog
from shared.db.supabase import table

log = plog.get("shared.events")


def emit(
    *,
    tenant_id: str,
    os_name: str,
    event_type: str,
    payload: dict[str, Any] | None = None,
    agent_name: str | None = None,
) -> None:
    """Append one row to `os_events`. Non-raising — meta-OS misses at most
    one signal if the write fails."""
    try:
        table("os_events").insert({
            "tenant_id": tenant_id,
            "os_name":   os_name,
            "event_type": event_type,
            "payload":    payload or {},
            "agent_name": agent_name,
        }).execute()
    except Exception as e:
        plog.event(log, "events.emit_failed", event_type=event_type, err=str(e))
