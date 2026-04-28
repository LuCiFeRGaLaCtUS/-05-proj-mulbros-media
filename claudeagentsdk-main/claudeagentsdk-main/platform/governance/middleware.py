"""@governed — the one decorator that wraps every tool call.

Responsibilities (in order per invocation):
    1. Identity — in Phase 0 this is a stub token with (tenant, os, agent, scopes).
       Phase 1 swaps in real Stytch verification.
    2. Sandbox redirect — if the tool is marked `outbound_channel`, rewrite target.
    3. Budget check — if the tool declares a `resource_key`, consult the ledger
       and pacing policy: allow / deny (near-cap) / throttle.
    4. Execute the wrapped function.
    5. Audit write — one row per call.

Intentionally simple in Phase 0. Policies are inline defaults; policies.yaml
comes in Phase 1.
"""
from __future__ import annotations

import functools
import time
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from governance import audit, sandbox
from shared import logging as plog

log = plog.get("governance.middleware")


def _default_sandbox() -> sandbox.SandboxConfig:
    return sandbox.SandboxConfig(enabled=False)


@dataclass
class GovContext:
    """Thread-local-ish bag holding the active tenant/os/agent for decorator reads."""
    tenant_id: str
    run_id: str
    os_name: str | None = None
    agent_name: str | None = None
    sandbox: sandbox.SandboxConfig = field(default_factory=_default_sandbox)
    # Agent-to-agent auth (Stytch HS256-signed JWT or upgrade path to real M2M).
    # Phase 0 used a fixed "stub-token" string; Phase 1 replaces with a real signed JWT.
    token: str = ""                          # the signed JWT itself
    token_id: str = "stub-token"             # jti, surfaced into audit rows
    scopes: list[str] = field(default_factory=list)   # scopes granted to this run
    version_manifest: dict[str, Any] | None = None
    # Accumulator updated by middleware on each call. Policies.cost_cap reads this.
    cost_so_far_usd: float = 0.0

    def add_cost(self, usd: float) -> None:
        self.cost_so_far_usd = (self.cost_so_far_usd or 0.0) + float(usd or 0.0)


_CTX: ContextVar[GovContext | None] = ContextVar("gov_ctx", default=None)


def set_context(ctx: GovContext) -> None:
    _CTX.set(ctx)


def current() -> GovContext:
    ctx = _CTX.get()
    if ctx is None:
        raise RuntimeError("No GovContext set. Every governed call must be inside a context.")
    return ctx


def governed(
    *,
    resource_key: str | None = None,
    units_per_call: float = 0.0,
    outbound_channel: str | None = None,   # "email" | "sms" | "voice" | None
):
    """Wrap an async tool handler with identity / sandbox / budget / audit.

    Usage:
        @governed(resource_key="apollo_credits", units_per_call=1)
        async def apollo_search(args: dict) -> dict: ...

        @governed(outbound_channel="email", resource_key="gmail_sends", units_per_call=1)
        async def gmail_send(args: dict) -> dict: ...
    """

    def _decorate(fn: Callable[[dict[str, Any]], Awaitable[Any]]):
        @functools.wraps(fn)
        async def _wrapper(args: dict[str, Any]):
            ctx = current()

            # (1) Identity / token verification.
            # If a real token is present on the context, verify it and enforce
            # scopes. The orchestrator mints one at run start; Phase 0 runs
            # with empty ctx.token fall through to stub-token in audit (back-compat).
            scope_ok = True
            scope_reason: str | None = None
            if ctx.token:
                try:
                    from shared.auth.stytch import verify_agent_token
                    claims = verify_agent_token(ctx.token)
                    needed = f"tool:{fn.__name__}"
                    if not claims.has_scope(needed) and not claims.has_scope("tool:*"):
                        scope_ok = False
                        scope_reason = (
                            f"agent {claims.agent_name!r} lacks scope {needed!r} "
                            f"(has: {claims.scopes})"
                        )
                except Exception as e:
                    scope_ok = False
                    scope_reason = f"token verification failed: {e}"

            # (2) Sandbox redirect — before anything else touches the args.
            eff_args = args
            sandboxed = False
            if outbound_channel and outbound_channel in sandbox.REDIRECTORS:
                eff_args = sandbox.REDIRECTORS[outbound_channel](args, ctx.sandbox)
                sandboxed = bool(eff_args.get("_sandbox"))

            policy_decision = "allow"
            policy_reason: str | None = None

            # Scope deny short-circuits the rest.
            if not scope_ok:
                policy_decision = "deny"
                policy_reason = scope_reason
                from governance import variance
                variance.raise_(
                    tenant_id=ctx.tenant_id,
                    os_name=ctx.os_name or "",
                    alert_type="policy_deny",
                    severity="warn",
                    message=f"Agent token scope check failed: {scope_reason}",
                    payload={"tool_name": fn.__name__, "rule_id": "agent_token_scope"},
                )

            # (3a) Policy check — hot-reloaded from policies.yaml every call.
            pv = None
            if policy_decision == "allow":
                from governance import policies as pol_engine
                pv = pol_engine.check(
                    tenant_id=ctx.tenant_id,
                    agent_name=ctx.agent_name,
                    tool_name=fn.__name__,
                    args=eff_args,
                    outbound_channel=outbound_channel,
                    cost_so_far=ctx.cost_so_far_usd,
                )
            if pv is not None and not pv.allow:
                policy_decision = "deny"
                policy_reason = pv.reason
                # Record a variance_alert so the chat can surface it
                from governance import variance
                variance.raise_(
                    tenant_id=ctx.tenant_id,
                    os_name=ctx.os_name or "",
                    alert_type="policy_deny",
                    severity="warn",
                    message=f"A policy denied the last action: {pv.reason}",
                    payload={"rule_id": pv.rule_id, "tool_name": fn.__name__},
                )

            # (3b) Budget / pacing check — only if policy already said allow.
            if policy_decision == "allow" and resource_key and units_per_call:
                from governance.budget import check_or_deny
                ok, reason = check_or_deny(
                    tenant_id=ctx.tenant_id,
                    os_name=ctx.os_name or "",
                    resource_key=resource_key,
                    units=units_per_call,
                )
                if not ok:
                    policy_decision = "deny"
                    policy_reason = reason

            t0 = time.perf_counter()
            result: Any
            if policy_decision == "deny":
                result = {"blocked": True, "reason": policy_reason}
            else:
                try:
                    result = await fn(eff_args)
                except Exception as e:
                    policy_decision = "error"
                    policy_reason = str(e)
                    result = {"error": str(e)}
                # Increment consumption on success
                if resource_key and units_per_call and policy_decision == "allow":
                    try:
                        from governance.budget import consume
                        consume(
                            tenant_id=ctx.tenant_id,
                            os_name=ctx.os_name or "",
                            resource_key=resource_key,
                            units=units_per_call,
                        )
                    except Exception as e:
                        plog.event(log, "budget.consume_failed", err=str(e))

            latency_ms = int((time.perf_counter() - t0) * 1000)

            audit.write(
                tenant_id=ctx.tenant_id,
                run_id=ctx.run_id,
                os_name=ctx.os_name,
                agent_name=ctx.agent_name,
                tool_name=fn.__name__,
                args=eff_args,
                result=result,
                policy_decision=policy_decision,
                policy_reason=policy_reason,
                token_id=ctx.token_id,
                version_manifest=ctx.version_manifest,
                latency_ms=latency_ms,
                resource_key=resource_key,
                units_consumed=units_per_call if (resource_key and policy_decision == "allow") else None,
                sandbox=sandboxed,
            )
            if policy_decision == "error":
                raise RuntimeError(policy_reason or "tool raised")
            return result

        return _wrapper

    return _decorate
