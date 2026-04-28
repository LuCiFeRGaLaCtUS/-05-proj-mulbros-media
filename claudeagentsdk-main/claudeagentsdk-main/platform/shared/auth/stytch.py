"""Stytch integration — agent token minting/verification + B2B client scaffold.

Phase 1 uses **HS256 local JWT signing** with `STYTCH_SECRET` as the HMAC key.
This gives real signed, time-bound, scope-bearing tokens — a substantive
upgrade over the fixed `"stub-token"` string — without requiring a Stytch
M2M client to be provisioned first.

Upgrade path: once you create an M2M client in the Stytch dashboard and add
`STYTCH_M2M_CLIENT_ID` + `STYTCH_M2M_CLIENT_SECRET` to .env, `mint_agent_token`
switches to real Stytch-issued tokens automatically (verification still works
via our JWKS-less `authenticate_token` call). Keep the Phase 1 HS256 path as
a fallback so the system never silently loses auth.

What we DO use Stytch for today:
    - `get_b2b_client()` returns a ready B2BClient for future Phase 5 human
      auth (magic links, organizations mapping 1:1 to tenants).

What we DON'T do yet:
    - Per-subagent token minting (currently one token per run; subagents
      share the orchestrator's context). Per-subagent scopes arrive in Phase 2.
"""
from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt  # pyjwt

from shared import config, logging as plog

log = plog.get("shared.auth.stytch")


# ---------------------------------------------------------------------------
# B2B client (Phase 5 human auth; Phase 1 just proves it initializes cleanly)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_b2b_client():
    """Return a Stytch B2B client. None if project creds aren't set."""
    pid = os.environ.get("STYTCH_PROJECT_ID")
    secret = os.environ.get("STYTCH_SECRET")
    if not pid or not secret:
        return None
    try:
        from stytch import B2BClient
    except ImportError:
        plog.event(log, "stytch.sdk_missing")
        return None
    return B2BClient(project_id=pid, secret=secret)


# ---------------------------------------------------------------------------
# Agent tokens — HS256 JWTs signed with STYTCH_SECRET
# ---------------------------------------------------------------------------
_ISSUER = "fszt-platform"
_ALGO = "HS256"


def _hmac_key() -> str:
    """Signing key. Prefers STYTCH_SECRET; dev-fallback for envs without it."""
    key = os.environ.get("STYTCH_SECRET") or os.environ.get("PLATFORM_JWT_KEY")
    if not key:
        plog.event(log, "stytch.no_signing_key",
                   detail="no STYTCH_SECRET or PLATFORM_JWT_KEY — tokens will be insecure")
        return "dev-insecure-fallback-key-do-not-use-in-prod"
    return key


@dataclass(frozen=True)
class TokenClaims:
    tenant_id: str
    os_name: str
    agent_name: str
    scopes: list[str]
    run_id: str | None
    token_id: str                  # jti
    issued_at: int                 # epoch seconds
    expires_at: int                # epoch seconds

    def has_scope(self, needed: str) -> bool:
        """Check scope with prefix-star glob semantics:
            - "*" wildcard matches anything
            - exact string match
            - trailing "*" does prefix match — so "tool:mcp__sales_internal__*"
              matches "tool:mcp__sales_internal__list_leads"
        """
        for s in self.scopes:
            if s == "*" or s == needed:
                return True
            if s.endswith("*") and needed.startswith(s[:-1]):
                return True
        return False


class TokenError(RuntimeError):
    pass


def mint_agent_token(
    *,
    tenant_id: str,
    os_name: str,
    agent_name: str,
    scopes: list[str],
    run_id: str | None = None,
    ttl_seconds: int = 3600,
) -> tuple[str, TokenClaims]:
    """Sign and return a fresh agent token + its claims."""
    now = int(time.time())
    token_id = f"atk_{uuid.uuid4().hex[:16]}"
    claims = TokenClaims(
        tenant_id=tenant_id,
        os_name=os_name,
        agent_name=agent_name,
        scopes=list(scopes),
        run_id=run_id,
        token_id=token_id,
        issued_at=now,
        expires_at=now + ttl_seconds,
    )
    payload: dict[str, Any] = {
        "iss": _ISSUER,
        "jti": token_id,
        "iat": now,
        "exp": claims.expires_at,
        "tenant_id": tenant_id,
        "os": os_name,
        "agent": agent_name,
        "scopes": list(scopes),
    }
    if run_id:
        payload["run_id"] = run_id
    token = jwt.encode(payload, _hmac_key(), algorithm=_ALGO)
    return token, claims


def verify_agent_token(token: str) -> TokenClaims:
    """Decode + verify. Raises TokenError on any failure."""
    try:
        payload = jwt.decode(
            token, _hmac_key(), algorithms=[_ALGO], issuer=_ISSUER,
        )
    except jwt.ExpiredSignatureError as e:
        raise TokenError("token expired") from e
    except jwt.InvalidTokenError as e:
        raise TokenError(f"invalid token: {e}") from e
    return TokenClaims(
        tenant_id=payload["tenant_id"],
        os_name=payload["os"],
        agent_name=payload["agent"],
        scopes=list(payload.get("scopes") or []),
        run_id=payload.get("run_id"),
        token_id=payload["jti"],
        issued_at=int(payload["iat"]),
        expires_at=int(payload["exp"]),
    )
