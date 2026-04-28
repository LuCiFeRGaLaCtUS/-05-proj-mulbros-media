"""Direct Twilio REST client — Composio doesn't have a Twilio toolkit, so we
hit Twilio's API ourselves. Keeps SMS as an optional capability: if the 3
env vars aren't set, `send_sms` returns a "not configured" signal cleanly.

Required env vars (all optional — SMS just disables if any is missing):
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_FROM_NUMBER        (E.164, e.g. +15551234567)

Pricing note: Twilio free trial gives ~$15 credit, enough for ~200 SMS.
"""
from __future__ import annotations

import os
from typing import Any

import httpx

from shared import logging as plog

log = plog.get("tools.twilio")


class TwilioNotConfigured(RuntimeError):
    """Raised when TWILIO_* env vars are not set. send_sms catches this
    and returns a user-friendly message instead of crashing."""


class TwilioSendError(RuntimeError):
    pass


def _creds() -> tuple[str, str, str]:
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    tok = os.environ.get("TWILIO_AUTH_TOKEN")
    frm = os.environ.get("TWILIO_FROM_NUMBER")
    missing = [k for k, v in [
        ("TWILIO_ACCOUNT_SID", sid),
        ("TWILIO_AUTH_TOKEN",  tok),
        ("TWILIO_FROM_NUMBER", frm),
    ] if not v]
    if missing:
        raise TwilioNotConfigured(
            f"SMS is not configured — set {', '.join(missing)} in .env to enable Twilio."
        )
    return sid, tok, frm  # type: ignore[return-value]


def send_sms(*, to: str, body: str) -> dict[str, Any]:
    """Send one SMS. Returns the parsed Twilio response body on success."""
    sid, tok, frm = _creds()
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    try:
        with httpx.Client(timeout=20.0, auth=(sid, tok)) as client:
            resp = client.post(url, data={"To": to, "From": frm, "Body": body})
    except httpx.HTTPError as e:
        raise TwilioSendError(f"network error: {e}") from e

    if resp.status_code >= 400:
        try:
            body_json = resp.json()
            msg = body_json.get("message") or resp.text
        except Exception:
            msg = resp.text
        raise TwilioSendError(f"Twilio returned {resp.status_code}: {msg}")

    return resp.json()
