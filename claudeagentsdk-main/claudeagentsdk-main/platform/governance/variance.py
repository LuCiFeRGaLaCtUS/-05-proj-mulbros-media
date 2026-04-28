"""Variance alerts — the "something's off" ledger.

When pacing guards deny a call, the budget nears cap, or a goal is at risk,
we write a row to `variance_alerts`. The orchestrator pulls recent unacked
alerts at run start and weaves them into its system prompt so the chat can
tell the user *before* they ask.

Alert schema (see shared/db/migrations/001_core.sql):
    tenant_id, os_name, alert_type, severity, message, payload, created_at, acked_at

Common `alert_type`s:
    behind_goal           — pacing engine detected we're falling short
    near_budget_cap       — >80% of an external budget consumed
    over_budget           — hit 100% of the cap; non-essential work blocked
    pacing_throttle       — a call was deferred because we were too far ahead of pace
    policy_deny           — a governance policy rejected a call
"""
from __future__ import annotations

from typing import Any

from shared import logging as plog
from shared.db.supabase import client, table

log = plog.get("governance.variance")


# ---------------------------------------------------------------------------
# Remedy hints — structured suggestions the chat can render as inline widgets
# ---------------------------------------------------------------------------
def _remedies_for(alert_type: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Return a list of actionable remedies the user could take.

    Structured so Phase 2's chat UI can render them as clickable widgets:
        {kind, label, action, args}
    """
    resource = payload.get("resource_key")
    if alert_type in ("near_budget_cap", "over_budget"):
        return [
            {"kind": "link", "label": f"Upgrade {resource} plan",
             "action": "open_url", "args": {"url": f"https://provider.composio/upgrade?resource={resource}"}},
            {"kind": "toggle", "label": "Pause non-essential outreach for this tenant",
             "action": "pause_outreach", "args": {"tenant_id": payload.get("tenant_id")}},
            {"kind": "button", "label": "Shift focus to another channel",
             "action": "shift_channel", "args": {"away_from": resource}},
        ]
    if alert_type == "behind_goal":
        return [
            {"kind": "button", "label": "Push harder this week",
             "action": "increase_daily_pace", "args": {"multiplier": 1.5}},
            {"kind": "button", "label": "Lower the target",
             "action": "adjust_goal", "args": {"direction": "down"}},
        ]
    if alert_type == "pacing_throttle":
        return [
            {"kind": "button", "label": "Run anyway (override pacing)",
             "action": "override_pacing_once", "args": {}},
        ]
    return []


# ---------------------------------------------------------------------------
# Write path
# ---------------------------------------------------------------------------
def raise_(
    *,
    tenant_id: str,
    os_name: str,
    alert_type: str,
    severity: str,             # "info" | "warn" | "critical"
    message: str,
    payload: dict[str, Any] | None = None,
) -> None:
    """Insert a variance_alert row. Swallows errors so a governance glitch
    never breaks a user's run."""
    pl = dict(payload or {})
    pl.setdefault("tenant_id", tenant_id)
    pl.setdefault("remedies", _remedies_for(alert_type, pl))
    try:
        table("variance_alerts").insert({
            "tenant_id": tenant_id,
            "os_name":   os_name,
            "alert_type": alert_type,
            "severity":  severity,
            "message":   message,
            "payload":   pl,
        }).execute()
    except Exception as e:
        plog.event(log, "variance.raise_failed", err=str(e), alert_type=alert_type)


# ---------------------------------------------------------------------------
# Read path — used by the orchestrator to weave into its system prompt
# ---------------------------------------------------------------------------
def recent_unacked(tenant_id: str, os_name: str, limit: int = 10) -> list[dict]:
    try:
        res = (
            table("variance_alerts")
            .select("alert_type,severity,message,payload,created_at")
            .eq("tenant_id", tenant_id)
            .eq("os_name",   os_name)
            .is_("acked_at", "null")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception as e:
        plog.event(log, "variance.read_failed", err=str(e))
        return []


def format_for_prompt(alerts: list[dict]) -> str:
    """Render alerts into a short, plain-language block to inject into the
    orchestrator's system prompt. Keeps the translation-layer principle —
    users never see 'alert_type=over_budget' style jargon."""
    if not alerts:
        return ""
    lines = ["", "## Recent alerts (surface these to the user naturally if relevant)"]
    for a in alerts:
        sev = a.get("severity", "info")
        icon = {"critical": "⚠️", "warn": "•", "info": "·"}.get(sev, "·")
        lines.append(f"{icon} {a.get('message','')}")
    return "\n".join(lines)
