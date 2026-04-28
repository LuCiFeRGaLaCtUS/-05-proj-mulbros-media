"""Hot-reloadable policy engine.

Policies live in config/policies.yaml and are re-read on every @governed call,
so edits take effect without restarting the platform. Per-tenant overrides
merge in from config/tenants/<slug>.yaml's `policy_overrides` key.

Phase 0 had the cost cap stubbed in tenant config; Phase 1 formalizes it as
a proper policy layer with:
    - cost_cap_per_run_usd   (soft limit; non-essential calls blocked on breach)
    - outbound_domain_blocklist  (glob patterns, hard deny)
    - tool_allowlist         (per-agent; glob patterns)

Scope discipline: this is NOT a general DSL. Keeping rules in Python is
explicit and debuggable. If we need a DSL later (e.g. "if agent=X and
time between 20:00-08:00"), we add it as a dedicated rule type, not by
building a generic evaluator.
"""
from __future__ import annotations

import fnmatch
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from shared import config, logging as plog

log = plog.get("governance.policies")


# ---------------------------------------------------------------------------
# Load + merge
# ---------------------------------------------------------------------------
def _global_policies() -> dict[str, Any]:
    path = Path(config.CONFIG_DIR) / "policies.yaml"
    if not path.exists():
        return {}
    try:
        return yaml.safe_load(path.read_text()) or {}
    except Exception as e:
        plog.event(log, "policies.parse_failed", err=str(e))
        return {}


def effective(tenant_id: str) -> dict[str, Any]:
    """Merge global + per-tenant overrides. Called on every policy_check."""
    base = _global_policies()
    try:
        tenant = config.tenant_yaml(tenant_id)
    except FileNotFoundError:
        return base
    overrides = (tenant.get("policy_overrides") or {})
    merged = {**base, **overrides}
    return merged


# ---------------------------------------------------------------------------
# Rule evaluators
# ---------------------------------------------------------------------------
@dataclass
class PolicyVerdict:
    allow: bool
    reason: str | None = None
    rule_id: str | None = None


def _check_cost_cap(pol: dict, cost_so_far: float) -> PolicyVerdict:
    cap = pol.get("cost_cap_per_run_usd")
    if cap is None:
        return PolicyVerdict(True)
    if cost_so_far >= float(cap):
        return PolicyVerdict(False,
                             f"cost cap reached this run (${cost_so_far:.4f} of ${float(cap):.2f})",
                             rule_id="cost_cap_per_run_usd")
    return PolicyVerdict(True)


def _check_domain_blocklist(pol: dict, outbound_channel: str | None,
                            args: dict[str, Any]) -> PolicyVerdict:
    if outbound_channel not in ("email",):
        return PolicyVerdict(True)
    patterns = pol.get("outbound_domain_blocklist") or []
    if not patterns:
        return PolicyVerdict(True)
    # Use the original_to if sandbox rewrote it — we're enforcing policy on the
    # REAL intended recipient, so sandbox redirect can't bypass this rule.
    target = args.get("original_to") or args.get("to") or ""
    if "@" not in str(target):
        return PolicyVerdict(True)
    domain = str(target).rsplit("@", 1)[-1].lower()
    for pat in patterns:
        if fnmatch.fnmatch(domain, pat.lower()):
            return PolicyVerdict(False,
                                 f"recipient domain {domain!r} is on the outbound blocklist",
                                 rule_id="outbound_domain_blocklist")
    return PolicyVerdict(True)


def _check_tool_allowlist(pol: dict, agent_name: str | None,
                          tool_name: str) -> PolicyVerdict:
    allow = (pol.get("tool_allowlist") or {}).get(agent_name or "") or []
    if not allow:
        return PolicyVerdict(True)
    for pat in allow:
        if fnmatch.fnmatch(tool_name, pat):
            return PolicyVerdict(True)
    return PolicyVerdict(False,
                         f"agent {agent_name!r} is not allowed to call {tool_name!r} (tool_allowlist)",
                         rule_id="tool_allowlist")


# ---------------------------------------------------------------------------
# Public entry — called by governance/middleware.py
# ---------------------------------------------------------------------------
def check(
    *,
    tenant_id: str,
    agent_name: str | None,
    tool_name: str,
    args: dict[str, Any],
    outbound_channel: str | None,
    cost_so_far: float,
) -> PolicyVerdict:
    pol = effective(tenant_id)

    # Order: cheapest checks first, hard-deny rules before soft.
    v = _check_tool_allowlist(pol, agent_name, tool_name)
    if not v.allow: return v
    v = _check_domain_blocklist(pol, outbound_channel, args)
    if not v.allow: return v
    v = _check_cost_cap(pol, cost_so_far)
    if not v.allow: return v
    return PolicyVerdict(True)
