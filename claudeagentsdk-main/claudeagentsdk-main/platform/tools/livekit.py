"""LiveKit client — room creation + access-token mint + optional SIP dial-out.

Phase 3 chunk 4 brings voice outbound online. Two modes:

    1. Room-only (no SIP):
       - Creates a LiveKit room; mints an access token for an operator
         to join from a browser/phone app.
       - Useful for "warm dial" scenarios where a human closes the loop.
       - Works on LiveKit Cloud free tier.

    2. Room + SIP dial-out:
       - Additionally sends a CreateSIPParticipant request using the
         configured SIP trunk so LiveKit bridges the room to a PSTN number.
       - Requires LIVEKIT_SIP_TRUNK_ID to be set (provisioned in the LiveKit
         dashboard or via Twilio/Telnyx BYO SIP).

If LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET aren't set, raises
LiveKitNotConfigured. The Sales OS's `send_voice` tool catches this and
returns status="skipped" gracefully, matching the Twilio pattern.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from shared import logging as plog

log = plog.get("tools.livekit")


class LiveKitNotConfigured(RuntimeError):
    pass


class LiveKitError(RuntimeError):
    pass


def _creds() -> tuple[str, str, str]:
    url    = os.environ.get("LIVEKIT_URL")
    key    = os.environ.get("LIVEKIT_API_KEY")
    secret = os.environ.get("LIVEKIT_API_SECRET")
    missing = [k for k, v in [("LIVEKIT_URL", url),
                               ("LIVEKIT_API_KEY", key),
                               ("LIVEKIT_API_SECRET", secret)] if not v]
    if missing:
        raise LiveKitNotConfigured(
            f"LiveKit is not configured — set {', '.join(missing)} in .env."
        )
    return url, key, secret  # type: ignore[return-value]


def _http_base() -> str:
    """LiveKit SDK needs an https URL, not the wss:// one."""
    url = _creds()[0]
    return url.replace("wss://", "https://").replace("ws://", "http://")


# ---------------------------------------------------------------------------
# Access tokens — for a human participant to join the room in a browser
# ---------------------------------------------------------------------------
@dataclass
class AccessTokenInfo:
    token:     str
    room:      str
    identity:  str
    expires_s: int


def mint_participant_token(
    room: str,
    identity: str,
    *,
    display_name: str | None = None,
    ttl_seconds: int = 3600,
) -> AccessTokenInfo:
    """Create an access token so a human can join `room` as `identity`."""
    _, key, secret = _creds()
    from livekit import api as lkapi

    grant = lkapi.VideoGrants(
        room_join=True,
        room=room,
        can_publish=True,
        can_subscribe=True,
    )
    token = (
        lkapi.AccessToken(key, secret)
        .with_identity(identity)
        .with_name(display_name or identity)
        .with_ttl(__import__("datetime").timedelta(seconds=ttl_seconds))
        .with_grants(grant)
    ).to_jwt()
    return AccessTokenInfo(token=token, room=room, identity=identity, expires_s=ttl_seconds)


# ---------------------------------------------------------------------------
# Room management
# ---------------------------------------------------------------------------
async def ensure_room(room: str, *, empty_timeout_s: int = 600) -> dict:
    """Create (or get) a room. Returns a dict with at least `name` + `sid`.
    If the room already exists, LiveKit returns the existing one."""
    _, key, secret = _creds()
    from livekit import api as lkapi

    lk = lkapi.LiveKitAPI(_http_base(), key, secret)
    try:
        resp = await lk.room.create_room(
            lkapi.CreateRoomRequest(name=room, empty_timeout=empty_timeout_s),
        )
        return {"name": resp.name, "sid": resp.sid}
    except Exception as e:
        raise LiveKitError(f"create_room failed: {e}") from e
    finally:
        await lk.aclose()


# ---------------------------------------------------------------------------
# SIP dial-out — optional (requires a provisioned trunk)
# ---------------------------------------------------------------------------
def _sip_trunk_id() -> str | None:
    return os.environ.get("LIVEKIT_SIP_TRUNK_ID") or None


async def create_sip_participant(
    *,
    room: str,
    phone_number: str,
    participant_identity: str = "sip-out",
    participant_name: str | None = None,
) -> dict:
    """Bridge `phone_number` into `room` via the configured SIP trunk.
    Returns participant info. Raises LiveKitError if SIP isn't configured
    or the trunk rejects the dial."""
    trunk = _sip_trunk_id()
    if not trunk:
        raise LiveKitError(
            "LIVEKIT_SIP_TRUNK_ID is not set — room-only mode. "
            "Configure a SIP trunk in LiveKit Cloud (or BYO Twilio/Telnyx) to enable PSTN outbound."
        )
    _, key, secret = _creds()
    from livekit import api as lkapi

    lk = lkapi.LiveKitAPI(_http_base(), key, secret)
    try:
        req = lkapi.CreateSIPParticipantRequest(
            sip_trunk_id=trunk,
            sip_call_to=phone_number,
            room_name=room,
            participant_identity=participant_identity,
            participant_name=participant_name or "Outbound lead",
            wait_until_answered=False,
        )
        resp = await lk.sip.create_sip_participant(req)
        return {
            "participant_id":       resp.participant_id,
            "participant_identity": resp.participant_identity,
            "sip_call_id":          resp.sip_call_id,
            "room":                 room,
        }
    except Exception as e:
        raise LiveKitError(f"create_sip_participant failed: {e}") from e
    finally:
        await lk.aclose()
