"""Sandbox mode — redirect outbound sends to a test destination.

When a tenant's config has sandbox.enabled=true, any tool that looks like
an outbound send (email/SMS/voice) gets its target rewritten *before* the
real provider is called. Original target stays in args metadata for the
audit log and post-run review.

This module is intentionally narrow: it only knows about the *shape* of
outbound calls, not their providers. BDR tools declare `outbound=True`
and name the fields to rewrite (via their decorator) — sandbox does the
rewrite.

Tenant YAML carries either the literal redirect target (legacy) or the
*name* of an env var that holds it (preferred — each developer's local
.env supplies their own inbox/phone):

    sandbox:
      enabled: true
      redirect_email_env: SANDBOX_EMAIL
      redirect_phone_env: SANDBOX_PHONE

Production (`APP_ENV=prod`) refuses to allow `enabled=true` on any tenant —
sandbox redirection must never be active in production. Dev (default) and
staging permit it.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from shared import config as _cfg
from shared import logging as _plog

_log = _plog.get("governance.sandbox")


@dataclass
class SandboxConfig:
    enabled: bool
    redirect_email: str | None = None
    redirect_phone: str | None = None
    redirect_email_env: str | None = None    # surfaced in errors so devs know what to set
    redirect_phone_env: str | None = None

    @classmethod
    def from_tenant(
        cls,
        tenant_sandbox: dict[str, Any] | None,
        *,
        tenant_id: str = "",
    ) -> "SandboxConfig":
        s = tenant_sandbox or {}
        enabled = bool(s.get("enabled"))

        # Production lockdown: sandbox must never be enabled in prod.
        if enabled and _cfg.is_prod():
            raise RuntimeError(
                f"Tenant {tenant_id or '<unknown>'!r} has sandbox.enabled=true but "
                f"APP_ENV=prod — production must not redirect customer outbound. "
                f"Disable sandbox in the tenant config or change APP_ENV."
            )

        email_env = s.get("redirect_email_env")
        phone_env = s.get("redirect_phone_env")

        # Literal value wins over env-var indirection (back-compat for old configs).
        email = s.get("redirect_email") or _resolve_env(email_env, enabled, tenant_id, "email")
        phone = s.get("redirect_phone") or _resolve_env(phone_env, enabled, tenant_id, "phone")

        return cls(
            enabled=enabled,
            redirect_email=email,
            redirect_phone=phone,
            redirect_email_env=email_env,
            redirect_phone_env=phone_env,
        )


def _resolve_env(env_name: str | None, enabled: bool, tenant_id: str, kind: str) -> str | None:
    if not env_name:
        return None
    val = (os.environ.get(env_name) or "").strip() or None
    if enabled and not val:
        _log.warning(
            f"Sandbox enabled for tenant {tenant_id or '<unknown>'!r} but "
            f"{env_name} is unset in .env — set it before running outbound flows.",
            extra={"tenant_id": tenant_id, "env_var": env_name, "kind": kind},
        )
    return val


SANDBOX_PREFIX = "[SANDBOX]"


def _missing_target_error(kind: str, env_name: str | None, original: Any) -> RuntimeError:
    where = f"set {env_name} in .env" if env_name else "set redirect_email/redirect_phone in the tenant config"
    return RuntimeError(
        f"Sandbox enabled but no redirect {kind} is configured. {where} "
        f"(see .env.example). Refused to send to original recipient: {original!r}."
    )


def redirect_email_args(args: dict[str, Any], cfg: SandboxConfig) -> dict[str, Any]:
    """Rewrite `to` + prefix subject. Preserves `original_to` in args for audit."""
    if not cfg.enabled:
        return args
    if not cfg.redirect_email:
        raise _missing_target_error("email", cfg.redirect_email_env, args.get("to"))
    new = dict(args)
    orig = new.get("to")
    new["original_to"] = orig
    new["to"] = cfg.redirect_email
    subject = new.get("subject") or ""
    new["subject"] = f"{SANDBOX_PREFIX} → {orig}  |  {subject}".strip()
    new["_sandbox"] = True
    return new


def redirect_sms_args(args: dict[str, Any], cfg: SandboxConfig) -> dict[str, Any]:
    if not cfg.enabled:
        return args
    if not cfg.redirect_phone:
        raise _missing_target_error("phone", cfg.redirect_phone_env, args.get("to"))
    new = dict(args)
    orig = new.get("to")
    new["original_to"] = orig
    new["to"] = cfg.redirect_phone
    body = new.get("body") or ""
    new["body"] = f"{SANDBOX_PREFIX} → {orig}: {body}".strip()
    new["_sandbox"] = True
    return new


def redirect_voice_args(args: dict[str, Any], cfg: SandboxConfig) -> dict[str, Any]:
    if not cfg.enabled:
        return args
    if not cfg.redirect_phone:
        raise _missing_target_error("phone", cfg.redirect_phone_env, args.get("to"))
    new = dict(args)
    orig = new.get("to")
    new["original_to"] = orig
    new["to"] = cfg.redirect_phone
    new["_sandbox"] = True
    return new


REDIRECTORS = {
    "email": redirect_email_args,
    "sms": redirect_sms_args,
    "voice": redirect_voice_args,
}


def startup_check_all_tenants() -> list[str]:
    """Walk every tenant config and validate sandbox setup for the active APP_ENV.

    Returns a list of human-readable warning strings (empty list = clean).
    Raises RuntimeError immediately if APP_ENV=prod and any tenant has sandbox
    enabled — production must hard-fail at boot, not silently misroute.

    Called from the FastAPI server startup and the CLI entry point so every
    developer sees missing-env warnings before they make their first call.
    """
    from pathlib import Path

    warnings: list[str] = []
    tenants_dir = Path(_cfg.CONFIG_DIR) / "tenants"
    if not tenants_dir.exists():
        return warnings

    for path in sorted(tenants_dir.glob("*.yaml")):
        if path.stem.startswith("_"):
            continue
        try:
            data = _cfg.tenant_yaml(path.stem)
        except Exception:
            continue
        s = data.get("sandbox") or {}
        if not s.get("enabled"):
            continue

        # Triggers the prod hard-fail (raises RuntimeError) when applicable.
        cfg = SandboxConfig.from_tenant(s, tenant_id=path.stem)

        if cfg.redirect_email_env and not cfg.redirect_email:
            warnings.append(
                f"Tenant {path.stem!r}: sandbox enabled but {cfg.redirect_email_env} "
                f"is unset in .env. Outbound email will refuse to send."
            )
        if cfg.redirect_phone_env and not cfg.redirect_phone:
            warnings.append(
                f"Tenant {path.stem!r}: sandbox enabled but {cfg.redirect_phone_env} "
                f"is unset in .env. Outbound SMS/voice will refuse to send."
            )
    return warnings


def format_startup_banner(warnings: list[str]) -> str | None:
    """Render a one-line banner from startup_check_all_tenants() output, or None."""
    if not warnings:
        return None
    lines = ["⚠ Sandbox redirect not configured:"]
    lines.extend(f"   - {w}" for w in warnings)
    lines.append("   Set SANDBOX_EMAIL and SANDBOX_PHONE in .env (see .env.example).")
    return "\n".join(lines)
