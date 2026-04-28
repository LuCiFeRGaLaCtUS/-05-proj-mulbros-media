"""Sales OS inbound handling — correlate a reply/form/SMS to a lead
and construct the brief that feeds the `sdr_inbound` subagent.

Chunk 2 of Phase 3. Called by apps/api/webhooks.py when a reply arrives.
The heavy lifting (qualify, respond, update lead) runs through the same
orchestrator.handle() the browser chat uses — we just build a proper brief
and kick it off.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from governance import pii
from shared import events as event_bus, logging as plog
from shared.db.supabase import client, table

log = plog.get("oses.sales.inbound")


@dataclass
class InboundPayload:
    tenant_id: str
    channel: str                     # "email" | "sms" | "form" | "voice"
    from_address: str | None = None  # prospect's email / phone / name
    subject: str | None = None
    body: str = ""
    correlation_id: str | None = None  # provider_id we embedded in an earlier send
    lead_email_hint: str | None = None
    lead_id_hint: str | None = None    # caller can pin it explicitly
    received_at: str | None = None     # ISO; defaults to server time if None


# ---------------------------------------------------------------------------
# Correlation — find the lead this inbound belongs to
# ---------------------------------------------------------------------------
def _lookup_by_outreach_provider(tenant_id: str, provider_id: str) -> dict | None:
    """If the inbound reply carries a provider_id from one of our outbound
    sends (Gmail message_id or Twilio sid), trace it back to the lead."""
    res = (
        table("outreach_events")
        .select("lead_id")
        .eq("tenant_id", tenant_id)
        .eq("provider_id", provider_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    lid = res.data[0]["lead_id"]
    if not lid:
        return None
    return _lookup_lead_by_id(tenant_id, lid)


def _lookup_lead_by_id(tenant_id: str, lead_id: str) -> dict | None:
    res = (
        table("leads").select("*")
        .eq("tenant_id", tenant_id).eq("id", lead_id)
        .limit(1).execute()
    )
    return (res.data or [None])[0]


def _lookup_by_email(tenant_id: str, email: str) -> dict | None:
    res = (
        table("leads").select("*")
        .eq("tenant_id", tenant_id).eq("email", email.lower())
        .limit(1).execute()
    )
    return (res.data or [None])[0]


def correlate(payload: InboundPayload) -> dict | None:
    """Find the lead this inbound belongs to. Returns None if no match —
    the caller can either create a placeholder or ignore."""
    # Explicit pin wins.
    if payload.lead_id_hint:
        hit = _lookup_lead_by_id(payload.tenant_id, payload.lead_id_hint)
        if hit:
            return hit
    if payload.correlation_id:
        hit = _lookup_by_outreach_provider(payload.tenant_id, payload.correlation_id)
        if hit:
            return hit
    candidates = [payload.from_address, payload.lead_email_hint]
    for c in candidates:
        if c and "@" in c:
            hit = _lookup_by_email(payload.tenant_id, c.lower())
            if hit:
                return hit
    return None


# ---------------------------------------------------------------------------
# Outreach ledger — record the inbound so the scanner + dashboard can see it
# ---------------------------------------------------------------------------
def record_inbound(payload: InboundPayload, lead_id: str | None) -> str | None:
    try:
        row = client().table("outreach_events").insert({
            "tenant_id":   payload.tenant_id,
            "lead_id":     lead_id,
            "channel":     payload.channel,
            "direction":   "inbound",
            "subject":     payload.subject,
            "body":        payload.body,
            "original_target": payload.from_address,
            "dispatched_to":   None,
            "sandbox":     False,
            "provider_id": payload.correlation_id,
            "status":      "received",
        }).execute()
        return (row.data or [{}])[0].get("id")
    except Exception as e:
        plog.event(log, "inbound.record_failed", err=str(e))
        return None


def emit_inbound_event(payload: InboundPayload, lead_id: str | None) -> None:
    event_bus.emit(
        tenant_id=payload.tenant_id,
        os_name="sales",
        event_type="inbound.received",
        payload={
            "channel":    payload.channel,
            "from":       payload.from_address,
            "lead_id":    lead_id,
            "correlation_id": payload.correlation_id,
            "body_sample": (payload.body or "")[:200],
        },
        agent_name="sdr_inbound_webhook",
    )


def cancel_cadence_on_reply(payload: InboundPayload, lead_id: str | None) -> int:
    """Once a lead replies, pending follow-ups to them are counter-productive.
    Returns the count cancelled."""
    if not lead_id:
        return 0
    from shared.db import cadence
    return cadence.cancel_for_lead(payload.tenant_id, lead_id, reason="inbound reply received")


# ---------------------------------------------------------------------------
# Brief construction — the natural-language input SDR will process
# ---------------------------------------------------------------------------
def build_sdr_brief(payload: InboundPayload, lead: dict | None) -> str:
    """Craft a brief the pre-classifier will route to sdr_inbound and the
    subagent will process via its existing prompt."""
    # Scrub obvious jailbreak patterns. Prospects don't send "ignore previous
    # instructions" legitimately; if the reply contains them we replace
    # inline (keeps the rest of the message intact for qualification).
    clean_body = pii.scrub_injection(payload.body or "")

    who = payload.from_address or "(unknown sender)"
    if lead:
        who = f"{lead.get('name') or who} at {lead.get('company') or '?'}"

    parts = [
        "A new inbound " + payload.channel + " arrived.",
        f"From: {who}",
    ]
    if payload.subject:
        parts.append(f"Subject: {payload.subject}")
    if lead:
        parts.append(
            f"Lead context: id={lead['id']}, current status={lead.get('status')}, "
            f"score={lead.get('score')}."
        )
    else:
        parts.append("No matching lead found — you can respond generically or "
                     "ask qualifying questions.")
    parts.append("")
    parts.append("Reply body:")
    parts.append("---")
    parts.append(clean_body)
    parts.append("---")
    parts.append("")
    parts.append("Apply the `reply-handling` skill to classify, then respond "
                 "per the SDR workflow. Use `send_email` (or matching channel) "
                 "to dispatch your reply. Then update the lead's status.")
    return "\n".join(parts)
