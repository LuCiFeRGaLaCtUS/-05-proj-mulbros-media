"""Audit writer. Every @governed call emits one row."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from shared.db.supabase import insert_with_tenant
from shared import logging as plog

log = plog.get("governance.audit")


def _hash(obj: Any) -> str:
    try:
        blob = json.dumps(obj, sort_keys=True, default=str)
    except Exception:
        blob = repr(obj)
    return hashlib.sha256(blob.encode()).hexdigest()[:16]


def write(
    *,
    tenant_id: str,
    run_id: str,
    os_name: str | None,
    agent_name: str | None,
    tool_name: str,
    args: Any,
    result: Any,
    policy_decision: str,
    policy_reason: str | None = None,
    token_id: str | None = None,
    version_manifest: dict[str, Any] | None = None,
    cost_usd: float | None = None,
    latency_ms: int | None = None,
    resource_key: str | None = None,
    units_consumed: float | None = None,
    sandbox: bool = False,
) -> None:
    row = {
        "run_id": run_id,
        "os_name": os_name,
        "agent_name": agent_name,
        "tool_name": tool_name,
        "args_hash": _hash(args),
        "result_hash": _hash(result),
        "policy_decision": policy_decision,
        "policy_reason": policy_reason,
        "token_id": token_id,
        "version_manifest": version_manifest or {},
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "resource_key": resource_key,
        "units_consumed": units_consumed,
        "sandbox": sandbox,
    }
    try:
        insert_with_tenant("audit_events", tenant_id, row)
    except Exception as e:
        # Never break a run because audit failed. Log loudly and continue.
        plog.event(log, "audit.write_failed", tool=tool_name, err=str(e))
