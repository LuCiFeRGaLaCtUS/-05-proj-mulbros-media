"""Inbound webhook handlers.

POST /api/webhooks/inbound
    Headers: X-Webhook-Secret: <PLATFORM_WEBHOOK_SECRET>
    Body:    JSON InboundPayload-compatible

Returns 202 Accepted immediately with the correlated lead_id (if any) and
kicks off the SDR flow as a background task — the SDR orchestrator run can
take a few minutes and we don't want the sender's HTTP client to block.
"""
from __future__ import annotations

import asyncio
import os

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from oses.sales import handle_async
from oses.sales.inbound import (
    InboundPayload,
    build_sdr_brief,
    cancel_cadence_on_reply,
    correlate,
    emit_inbound_event,
    record_inbound,
)
from platform_os import tenant as tenant_mod
from shared import config, logging as plog
from shared.db import chat as chat_db


log = plog.get("apps.api.webhooks")
router = APIRouter()


class _InboundBody(BaseModel):
    tenant_id: str
    channel:   str = Field(pattern=r"^(email|sms|form|voice)$")
    from_:     str | None = Field(default=None, alias="from")
    subject:   str | None = None
    body:      str = ""
    correlation_id: str | None = None
    lead_email_hint: str | None = None
    lead_id_hint: str | None = None
    received_at: str | None = None

    class Config:
        populate_by_name = True


def _check_auth(x_webhook_secret: str | None) -> None:
    expected = os.environ.get("PLATFORM_WEBHOOK_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="webhook not configured (no PLATFORM_WEBHOOK_SECRET)")
    if x_webhook_secret != expected:
        raise HTTPException(status_code=401, detail="bad or missing X-Webhook-Secret")


async def _run_sdr(tenant_id: str, brief: str, session_id: str) -> None:
    """Background task — drains the orchestrator stream without an HTTP caller."""
    config.load_env()
    tctx = tenant_mod.load(tenant_id, session_id=session_id)
    try:
        async for _event in handle_async(brief, tctx):
            pass
    except Exception as e:
        plog.event(log, "webhook.sdr_run_failed", err=str(e))


@router.post("/api/webhooks/inbound", status_code=202)
async def inbound(
    body: _InboundBody,
    request: Request,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
):
    _check_auth(x_webhook_secret)

    payload = InboundPayload(
        tenant_id=body.tenant_id,
        channel=body.channel,
        from_address=body.from_,
        subject=body.subject,
        body=body.body,
        correlation_id=body.correlation_id,
        lead_email_hint=body.lead_email_hint,
        lead_id_hint=body.lead_id_hint,
        received_at=body.received_at,
    )

    # Correlate to a lead (may be None for genuinely new inbound).
    lead = correlate(payload)
    lead_id = lead["id"] if lead else None

    # Write the inbound to the outreach ledger + fire the event bus
    outreach_event_id = record_inbound(payload, lead_id)
    emit_inbound_event(payload, lead_id)

    # Cancel any scheduled cadence touches for this lead — they've replied,
    # chasing them now would be counter-productive.
    cancelled_touches = cancel_cadence_on_reply(payload, lead_id)

    # Open a fresh chat session to anchor the SDR conversation. Title uses
    # "Reply from <who>" so the sidebar makes sense.
    who_label = (
        (lead.get("name") if lead else None)
        or payload.from_address
        or f"inbound {payload.channel}"
    )
    session = chat_db.create_session(
        tenant_id=body.tenant_id, os_name="sales",
        title=f"Reply from {who_label}",
    )

    # Build SDR brief + kick off in background so we can 202 immediately.
    sdr_brief = build_sdr_brief(payload, lead)
    asyncio.create_task(_run_sdr(body.tenant_id, sdr_brief, session["id"]))

    return {
        "accepted":         True,
        "lead_id":          lead_id,
        "lead_found":       lead is not None,
        "outreach_event_id": outreach_event_id,
        "cancelled_follow_ups": cancelled_touches,
        "session_id":       session["id"],
        "note":             "SDR is running in the background; check the session or the outreach_events table for the outcome.",
    }
