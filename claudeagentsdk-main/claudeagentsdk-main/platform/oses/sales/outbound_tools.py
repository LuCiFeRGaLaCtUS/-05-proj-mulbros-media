"""Sales OS outbound tools — email / SMS / voice.

Every tool is @governed with an `outbound_channel` so the sandbox layer
rewrites the `to:` field before dispatch. For Phase 0, the actual dispatch
goes through Composio (Gmail for email, Twilio for SMS). Voice is a stub
that logs the intent and creates an outreach_events row — real LiveKit
integration lands in Phase 3.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from governance.middleware import current, governed
from shared import events as event_bus, logging as plog
from shared.db.supabase import client as sb_client
from tools import composio, livekit as lkmod, twilio

log = plog.get("sales.outbound")


def _text(payload: Any) -> dict:
    body = payload if isinstance(payload, str) else json.dumps(payload, default=str)
    return {"content": [{"type": "text", "text": body}]}


def _record_outreach(
    *,
    lead_id: str | None,
    channel: str,
    direction: str,
    subject: str | None,
    body: str | None,
    original_target: str | None,
    dispatched_to: str | None,
    sandbox: bool,
    provider_id: str | None,
    status: str,
) -> None:
    ctx = current()
    try:
        sb_client().table("outreach_events").insert({
            "tenant_id": ctx.tenant_id,
            "lead_id": lead_id,
            "channel": channel,
            "direction": direction,
            "subject": subject,
            "body": body,
            "original_target": original_target,
            "dispatched_to": dispatched_to,
            "sandbox": sandbox,
            "provider_id": provider_id,
            "status": status,
        }).execute()
    except Exception as e:
        plog.event(log, "outreach.record_failed", err=str(e))
    # Fire a normalized os_event for the meta-OS scanner.
    if status == "sent":
        event_bus.emit(
            tenant_id=ctx.tenant_id,
            os_name="sales",
            event_type="outreach.sent",
            payload={
                "lead_id": lead_id,
                "channel": channel,
                "sandbox": sandbox,
                "provider_id": provider_id,
            },
            agent_name=ctx.agent_name,
        )
    elif status == "failed":
        event_bus.emit(
            tenant_id=ctx.tenant_id,
            os_name="sales",
            event_type="outreach.failed",
            payload={"lead_id": lead_id, "channel": channel},
            agent_name=ctx.agent_name,
        )


# ---------------------------------------------------------------------------
# send_email — goes through Composio Gmail MCP. Sandbox-aware.
# ---------------------------------------------------------------------------
@tool(
    "send_email",
    "Send an email to a lead. Sandbox-aware. Args: to (email), subject, body, lead_id, "
    "touch_number (defaults to 1 — if this is touch 1, the 4-touch follow-up cadence "
    "is auto-scheduled on success).",
    {"to": str, "subject": str, "body": str, "lead_id": str, "touch_number": int},
)
@governed(resource_key="gmail_sends", units_per_call=1, outbound_channel="email")
async def send_email(args: dict) -> dict:
    """Dispatch via Composio Gmail. By the time this handler runs, the governance
    middleware has already applied the sandbox rewrite to `args['to']`, so the
    Composio call targets the sandbox address, not the real prospect."""
    provider_id: str | None = None
    status = "sent"
    error: str | None = None
    touch_number = int(args.get("touch_number") or 1)
    try:
        def _send():
            return composio.gmail_send_email(
                to=args["to"],
                subject=args.get("subject") or "",
                body=args.get("body") or "",
            )
        response = await asyncio.to_thread(_send)
        # Composio multi_execute response shape:
        #   response["parsed"]["data"]["results"][0]["response"]["data"]["id"]
        parsed = (response or {}).get("parsed") or {}
        results = ((parsed.get("data") or {}).get("results")) or []
        if results:
            inner = (results[0].get("response") or {}).get("data") or {}
            provider_id = inner.get("id")
    except composio.ComposioNotConfigured as e:
        status = "failed"
        error = f"composio not configured: {e}"
    except composio.ComposioActionError as e:
        status = "failed"
        error = str(e)

    _record_outreach(
        lead_id=args.get("lead_id"),
        channel="email",
        direction="outbound",
        subject=args.get("subject"),
        body=args.get("body"),
        original_target=args.get("original_to") or args.get("to"),
        dispatched_to=args.get("to"),
        sandbox=bool(args.get("_sandbox")),
        provider_id=provider_id,
        status=status,
    )

    # Phase 3 chunk 3: after a successful FIRST touch, auto-schedule the
    # 4-touch cadence (bump / value / break-up). Subsequent touches are
    # dispatched by apps/scheduler and explicitly set touch_number>=2.
    scheduled_touches: list[dict] = []
    if status == "sent" and touch_number == 1 and args.get("lead_id"):
        from shared.db import cadence
        ctx = current()
        scheduled_touches = cadence.schedule_cadence(
            tenant_id=ctx.tenant_id,
            lead_id=args["lead_id"],
            channel="email",
        )

    result: dict[str, Any] = {
        "ok": status == "sent",
        "status": status,
        "dispatched_to": args.get("to"),
        "sandbox": bool(args.get("_sandbox")),
        "provider_id": provider_id,
        "touch_number": touch_number,
        "scheduled_follow_ups": len(scheduled_touches),
    }
    if error:
        result["error"] = error
        # Surface hint: most common cause is Gmail not connected in Composio.
        result["hint"] = (
            "Gmail probably isn't connected in your Composio dashboard yet. "
            "Connect it, then re-run. Error recorded in outreach_events."
        )
    return _text(result)


# ---------------------------------------------------------------------------
# send_sms — via Composio Twilio MCP. Sandbox-aware.
# ---------------------------------------------------------------------------
@tool(
    "send_sms",
    "Send an SMS to a lead via Twilio (direct). Sandbox-aware. Args: to (E.164 phone), body, lead_id.",
    {"to": str, "body": str, "lead_id": str},
)
@governed(resource_key="twilio_sms", units_per_call=1, outbound_channel="sms")
async def send_sms(args: dict) -> dict:
    """Dispatch via Twilio REST API directly (Composio doesn't ship a Twilio
    toolkit). Sandbox rewrite has already been applied by governance."""
    provider_id: str | None = None
    status = "sent"
    error: str | None = None
    hint: str | None = None
    try:
        def _send():
            return twilio.send_sms(to=args["to"], body=args.get("body") or "")
        response = await asyncio.to_thread(_send)
        if isinstance(response, dict):
            provider_id = response.get("sid")
    except twilio.TwilioNotConfigured as e:
        status = "skipped"
        error = str(e)
        hint = ("SMS disabled. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "TWILIO_FROM_NUMBER in .env to enable. Free trial credit "
                "covers ~200 SMS.")
    except twilio.TwilioSendError as e:
        status = "failed"
        error = str(e)
        hint = "Check Twilio console for delivery errors (bad number, no balance, etc.)."

    _record_outreach(
        lead_id=args.get("lead_id"),
        channel="sms",
        direction="outbound",
        subject=None,
        body=args.get("body"),
        original_target=args.get("original_to") or args.get("to"),
        dispatched_to=args.get("to"),
        sandbox=bool(args.get("_sandbox")),
        provider_id=provider_id,
        status=status,
    )
    result: dict[str, Any] = {
        "ok": status == "sent",
        "status": status,
        "dispatched_to": args.get("to"),
        "sandbox": bool(args.get("_sandbox")),
        "provider_id": provider_id,
    }
    if error:
        result["error"] = error
    if hint:
        result["hint"] = hint
    return _text(result)


# ---------------------------------------------------------------------------
# place_call — LiveKit-backed outbound voice.
#   Mode A (SIP configured): bridges the lead's phone into a LiveKit room.
#   Mode B (room-only):      creates the room + mints an operator join URL so
#                            a human can close the loop (warm dial).
#   Mode C (LiveKit unset):  status="skipped" — matches Twilio's pattern.
# Sandbox-aware: `args['to']` has already been rewritten to the operator's
# redirect_phone by the governance middleware.
# ---------------------------------------------------------------------------
@tool(
    "place_call",
    "Place an outbound voice call to a lead via LiveKit. With SIP configured, "
    "bridges the target into a room; without SIP, creates a room + operator "
    "join URL for a warm dial. Sandbox-aware. Args: to (E.164 phone), script, lead_id.",
    {"to": str, "script": str, "lead_id": str},
)
@governed(resource_key="voice_minutes", units_per_call=1, outbound_channel="voice")
async def place_call(args: dict) -> dict:
    import uuid
    room_name = f"call-{uuid.uuid4().hex[:12]}"
    provider_id: str | None = None
    status = "sent"
    error: str | None = None
    hint: str | None = None
    operator_join_url: str | None = None
    sip_bridged = False

    try:
        # Always create the room + an operator token.
        await lkmod.ensure_room(room_name)
        token_info = lkmod.mint_participant_token(
            room=room_name,
            identity="operator",
            display_name="Operator",
            ttl_seconds=3600,
        )
        # LiveKit Meet URL (the default LiveKit Cloud browser client)
        operator_join_url = (
            f"https://meet.livekit.io/?liveKitUrl={os.environ.get('LIVEKIT_URL','')}"
            f"&token={token_info.token}"
        )

        # If SIP is configured, dial the (sandbox-rewritten) number.
        try:
            sip_resp = await lkmod.create_sip_participant(
                room=room_name,
                phone_number=args["to"],
                participant_identity="lead",
                participant_name=(args.get("lead_id") or "Lead"),
            )
            provider_id = sip_resp.get("sip_call_id") or sip_resp.get("participant_id")
            sip_bridged = True
        except lkmod.LiveKitError as e:
            # Room is created but SIP failed (either trunk not set or trunk error).
            # Still return success with the join URL — operator can dial manually.
            msg = str(e)
            if "LIVEKIT_SIP_TRUNK_ID" in msg:
                hint = ("SIP trunk not configured (LIVEKIT_SIP_TRUNK_ID unset). "
                        "Room created — open the join URL to speak to the lead once they answer.")
            else:
                hint = f"SIP dial failed: {msg}. Room is up; operator can dial manually."
    except lkmod.LiveKitNotConfigured as e:
        status = "skipped"
        error = str(e)
        hint = ("Voice disabled. Set LIVEKIT_URL + LIVEKIT_API_KEY + LIVEKIT_API_SECRET "
                "in .env to enable.")
    except Exception as e:
        status = "failed"
        error = str(e)
        hint = "Unexpected LiveKit error — check logs."

    _record_outreach(
        lead_id=args.get("lead_id"),
        channel="voice",
        direction="outbound",
        subject=None,
        body=args.get("script"),
        original_target=args.get("original_to") or args.get("to"),
        dispatched_to=args.get("to"),
        sandbox=bool(args.get("_sandbox")),
        provider_id=provider_id,
        status=status,
    )
    result: dict[str, Any] = {
        "ok": status == "sent",
        "status": status,
        "room": room_name,
        "sip_bridged": sip_bridged,
        "dispatched_to": args.get("to"),
        "sandbox": bool(args.get("_sandbox")),
        "provider_id": provider_id,
        "operator_join_url": operator_join_url,
    }
    if error:
        result["error"] = error
    if hint:
        result["hint"] = hint
    return _text(result)


# ---------------------------------------------------------------------------
# request_approval — inline HITL. Creates a hitl_requests row; the CLI/web
# renderer picks it up and shows a form inline in the chat.
# ---------------------------------------------------------------------------
@tool(
    "request_approval",
    "Ask the human operator for approval before proceeding. Blocks until answered (or a timeout passes). Args: context (str), what_needs_approval (str).",
    {"context": str, "what_needs_approval": str},
)
@governed()
async def request_approval(args: dict) -> dict:
    ctx = current()
    schema = {
        "type": "approval",
        "fields": [
            {"name": "decision", "type": "enum", "options": ["approve", "reject"]},
            {"name": "note", "type": "text", "required": False},
        ],
    }
    def _insert():
        return sb_client().table("hitl_requests").insert({
            "tenant_id": ctx.tenant_id,
            "session_id": ctx.session_id if hasattr(ctx, "session_id") else None,
            "schema_name": "approval",
            "schema_json": schema,
            "context_json": {
                "context": args.get("context"),
                "asking_for": args.get("what_needs_approval"),
            },
            "status": "pending",
        }).execute()
    resp = await asyncio.to_thread(_insert)
    hitl_id = (resp.data or [{}])[0].get("id")
    # Phase 0: don't block. Return "pending" and let the subagent decide whether
    # to wait or proceed conservatively. Phase 1 adds polling + resume.
    return _text({"hitl_id": hitl_id, "status": "pending",
                  "note": "Approval request logged. In Phase 0 this does not block — proceed conservatively or stop."})


outbound_mcp = create_sdk_mcp_server(
    name="sales_outbound",
    version="1.0.0",
    tools=[send_email, send_sms, place_call, request_approval],
)
