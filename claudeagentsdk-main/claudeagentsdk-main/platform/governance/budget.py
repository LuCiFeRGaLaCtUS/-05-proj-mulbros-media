"""Budget ledger + pacing v1.

Called by the @governed decorator on every resource-consuming tool call:
    - check_or_deny(): is this call allowed by the current budget + pacing?
    - consume(): record units used
    - status(): report ahead / on_pace / behind / at_risk / over_budget

Phase 0 implements the basics. Phase 1 adds richer strategies (auto-defer,
variance-alert emission with remedy widgets, per-tenant overrides).
"""
from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from shared.db.supabase import client, table


# ---------------------------------------------------------------------------
# Period math
# ---------------------------------------------------------------------------
def _period_bounds(period: str, today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    if period == "day":
        return today, today
    if period == "week":
        start = today - timedelta(days=today.weekday())
        return start, start + timedelta(days=6)
    if period == "month":
        days_in = calendar.monthrange(today.year, today.month)[1]
        start = today.replace(day=1)
        end = today.replace(day=days_in)
        return start, end
    raise ValueError(f"unknown period {period!r}")


def _elapsed_ratio(start: date, end: date, today: date | None = None) -> float:
    today = today or date.today()
    total = (end - start).days + 1
    elapsed = max(0, min(total, (today - start).days + 1))
    return elapsed / total


# ---------------------------------------------------------------------------
# Budget ledger reads/writes
# ---------------------------------------------------------------------------
def _get_budget_row(tenant_id: str, os_name: str, resource_key: str, period_start: date) -> dict[str, Any] | None:
    res = (
        table("external_budgets")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("resource_key", resource_key)
        .eq("period_start", period_start.isoformat())
        .limit(1)
        .execute()
    )
    return (res.data or [None])[0]


def _get_active_budget_row(tenant_id: str, os_name: str, resource_key: str) -> dict[str, Any] | None:
    """Return the budget row whose period spans today, regardless of day/week/month."""
    today = date.today().isoformat()
    res = (
        table("external_budgets")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("resource_key", resource_key)
        .lte("period_start", today)
        .gte("period_end", today)
        .limit(1)
        .execute()
    )
    return (res.data or [None])[0]


def ensure_budget(
    tenant_id: str,
    os_name: str,
    resource_key: str,
    limit_value: float,
    period: str = "month",
) -> dict[str, Any]:
    """Upsert a budget row for the current period. Safe to call at bootstrap."""
    start, end = _period_bounds(period)
    existing = _get_budget_row(tenant_id, os_name, resource_key, start)
    if existing:
        return existing
    row = {
        "tenant_id": tenant_id,
        "os_name": os_name,
        "resource_key": resource_key,
        "period": period,
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "limit_value": limit_value,
        "consumed": 0,
    }
    res = table("external_budgets").insert(row).execute()
    return (res.data or [row])[0]


# ---------------------------------------------------------------------------
# Pacing policy
# ---------------------------------------------------------------------------
@dataclass
class PacingVerdict:
    allow: bool
    reason: str | None = None
    kind: str | None = None              # "over_budget" | "pacing_throttle" | "near_budget_cap" | None
    severity: str | None = None          # "info" | "warn" | "critical"


def _pacing_verdict(budget: dict[str, Any], want_units: float) -> PacingVerdict:
    limit = float(budget["limit_value"])
    consumed = float(budget["consumed"])
    remaining = limit - consumed

    if want_units > remaining:
        return PacingVerdict(
            allow=False,
            reason=f"would exceed {budget['resource_key']} cap "
                   f"({consumed + want_units:.1f}/{limit:.1f})",
            kind="over_budget",
            severity="critical",
        )

    # Pacing: how much of the period has elapsed vs how much of the budget is gone?
    start = date.fromisoformat(budget["period_start"])
    end = date.fromisoformat(budget["period_end"])
    elapsed = _elapsed_ratio(start, end)
    used = (consumed + want_units) / limit if limit > 0 else 0
    # Allow a little leeway ahead of pace (bursty ok up to 2x elapsed ratio).
    ceiling = max(0.10, elapsed * 2.0)
    if used > ceiling:
        return PacingVerdict(
            allow=False,
            reason=f"pacing guard: {budget['resource_key']} would be {used*100:.0f}% used "
                   f"at {elapsed*100:.0f}% of period — defer",
            kind="pacing_throttle",
            severity="info",
        )
    # If close to cap (>80%), only allow tiny increments.
    if used > 0.80 and want_units > max(1.0, limit * 0.02):
        return PacingVerdict(
            allow=False,
            reason=f"near cap: {used*100:.0f}% of {budget['resource_key']} consumed — throttling",
            kind="near_budget_cap",
            severity="warn",
        )
    return PacingVerdict(allow=True)


# ---------------------------------------------------------------------------
# Public API consumed by @governed
# ---------------------------------------------------------------------------
def check_or_deny(
    tenant_id: str,
    os_name: str,
    resource_key: str,
    units: float,
) -> tuple[bool, str | None]:
    """Return (allow, reason). Writes a variance_alert on denial (idempotent-ish
    — duplicate alerts within a short window are expected and harmless)."""
    from governance import variance  # lazy to avoid cycle

    budget = _get_active_budget_row(tenant_id, os_name, resource_key)
    if budget is None:
        # No ledger = no cap recorded. Phase 0 default: allow but log.
        return True, None
    verdict = _pacing_verdict(budget, units)
    if not verdict.allow and verdict.kind:
        pct = (float(budget["consumed"]) / float(budget["limit_value"]) * 100
               if float(budget["limit_value"]) > 0 else 0)
        friendly = {
            "over_budget":      f"I'm out of {resource_key} for this period ({pct:.0f}% used).",
            "near_budget_cap":  f"I'm near the {resource_key} cap ({pct:.0f}% used) — slowing down.",
            "pacing_throttle":  f"We're ahead of pace on {resource_key} — deferring some work to spread it across the period.",
        }[verdict.kind]
        variance.raise_(
            tenant_id=tenant_id,
            os_name=os_name,
            alert_type=verdict.kind,
            severity=verdict.severity or "info",
            message=friendly,
            payload={
                "resource_key": resource_key,
                "limit":        float(budget["limit_value"]),
                "consumed":     float(budget["consumed"]),
                "units_attempted": units,
                "period":       budget.get("period"),
                "period_end":   budget.get("period_end"),
            },
        )
    return verdict.allow, verdict.reason


def consume(tenant_id: str, os_name: str, resource_key: str, units: float) -> None:
    """Increment the consumed counter on the current-period row."""
    budget = _get_active_budget_row(tenant_id, os_name, resource_key)
    if budget is None:
        return
    new_consumed = float(budget["consumed"]) + units
    (
        table("external_budgets")
        .update({"consumed": new_consumed})
        .eq("id", budget["id"])
        .execute()
    )


# ---------------------------------------------------------------------------
# Goal-based pace status (for dashboard strip)
# ---------------------------------------------------------------------------
def goal_status(tenant_id: str, os_name: str, metric_name: str) -> dict[str, Any] | None:
    start, end = _period_bounds("month")
    res = (
        table("goals")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("metric_name", metric_name)
        .eq("period_start", start.isoformat())
        .limit(1)
        .execute()
    )
    goal = (res.data or [None])[0]
    if goal is None:
        return None
    target = float(goal["target_value"])
    current = float(goal["current_value"])
    elapsed = _elapsed_ratio(start, end)
    progress = (current / target) if target > 0 else 0
    if elapsed == 0:
        status = "on_pace"
    elif progress >= elapsed * 1.10:
        status = "ahead"
    elif progress >= elapsed * 0.90:
        status = "on_pace"
    elif progress >= elapsed * 0.80:
        status = "behind"
    else:
        status = "at_risk"
    days_remaining = max(0, (end - date.today()).days)
    return {
        "status": status,
        "target": target,
        "current": current,
        "progress_ratio": progress,
        "elapsed_ratio": elapsed,
        "days_remaining": days_remaining,
        "ideal_pace_per_day": (target - current) / max(1, days_remaining),
    }
