"""Idempotent tenant bootstrap.

After migrations have been applied, this ensures:
  1. The tenant row exists (upsert from config/tenants/<slug>.yaml)
  2. External-service budgets exist for the current period
  3. A north-star goal exists for the current period

Safe to re-run — every step uses `on conflict` or existence checks, so calling
`make bootstrap` twice is a no-op. Run it any time you change the tenant's
budget caps or goal — it'll pick up the new numbers on the next period start,
and for the current period it updates limits in place.

Usage:
    python -m shared.db.bootstrap --tenant acme-test
"""
from __future__ import annotations

import argparse
import calendar
import sys
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from governance import budget as bg
from platform_os import registry, tenant as tenant_mod
from shared import config, logging as plog
from shared.db.supabase import client, table

log = plog.get("bootstrap")


# ---------------------------------------------------------------------------
# Tenant row
# ---------------------------------------------------------------------------
def _ensure_tenant(tenant_id: str, tenant_data: dict[str, Any]) -> None:
    existing = (
        table("tenants").select("tenant_id").eq("tenant_id", tenant_id).limit(1).execute()
    )
    if existing.data:
        print(f"  ✓ tenant {tenant_id!r} already exists")
        return
    table("tenants").insert({
        "tenant_id": tenant_id,
        "display_name": tenant_data.get("display_name", tenant_id),
        "locale": tenant_data.get("locale", "en-US"),
        "timezone": tenant_data.get("timezone", "UTC"),
    }).execute()
    print(f"  + tenant {tenant_id!r} created")


# ---------------------------------------------------------------------------
# Budgets
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
        return today.replace(day=1), today.replace(day=days_in)
    raise ValueError(f"unknown period {period!r}")


def _ensure_budget(
    tenant_id: str, os_name: str, resource_key: str, limit_value: float, period: str,
) -> None:
    start, end = _period_bounds(period)
    existing = (
        table("external_budgets")
        .select("id,limit_value")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("resource_key", resource_key)
        .eq("period_start", start.isoformat())
        .limit(1)
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        if float(row["limit_value"]) != float(limit_value):
            table("external_budgets").update({"limit_value": limit_value}).eq("id", row["id"]).execute()
            print(f"  ~ budget {resource_key} ({period}) limit updated → {limit_value}")
        else:
            print(f"  ✓ budget {resource_key} ({period}) = {limit_value}")
        return
    table("external_budgets").insert({
        "tenant_id": tenant_id,
        "os_name": os_name,
        "resource_key": resource_key,
        "period": period,
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "limit_value": limit_value,
        "consumed": 0,
    }).execute()
    print(f"  + budget {resource_key} ({period}) = {limit_value}")


def _seed_budgets(tenant_id: str, tenant_data: dict[str, Any], entitled_oses: list[str]) -> None:
    """Seed one budget row per (OS, resource) this tenant cares about.

    Rules:
      - OS declares its `resources` list (oses/<os>/__init__.py RESOURCES).
      - Tenant's `resource_defaults` YAML overrides the limit + period.
      - If a resource isn't mentioned in the tenant's config, we skip it
        (permissive default: no budget row = no cap). The user can add
        later via the wizard (Phase 1) or by editing the YAML and re-running.
    """
    defaults = tenant_data.get("resource_defaults") or {}
    for os_name in entitled_oses:
        os_instance = registry.get(os_name)
        for res in os_instance.resources:
            spec = defaults.get(res.key)
            if not spec:
                print(f"  (skip) {os_name}/{res.key} — no resource_defaults entry")
                continue
            limit = float(spec.get("limit", 0))
            period = spec.get("period", res.default_period)
            if limit <= 0:
                print(f"  (skip) {os_name}/{res.key} — limit is 0")
                continue
            _ensure_budget(tenant_id, os_name, res.key, limit, period)


# ---------------------------------------------------------------------------
# Goal
# ---------------------------------------------------------------------------
def _ensure_goal(
    tenant_id: str, os_name: str, metric: str, target: float, period: str,
) -> None:
    start, end = _period_bounds(period)
    existing = (
        table("goals")
        .select("id,target_value")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("metric_name", metric)
        .eq("period_start", start.isoformat())
        .limit(1)
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        if float(row["target_value"]) != float(target):
            table("goals").update({"target_value": target}).eq("id", row["id"]).execute()
            print(f"  ~ goal {metric} ({period}) target updated → {target}")
        else:
            print(f"  ✓ goal {metric} ({period}) = {target}")
        return
    table("goals").insert({
        "tenant_id": tenant_id,
        "os_name": os_name,
        "metric_name": metric,
        "target_value": target,
        "current_value": 0,
        "period": period,
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
    }).execute()
    print(f"  + goal {metric} ({period}) = {target}")


def _seed_goal(tenant_id: str, tenant_data: dict[str, Any], entitled_oses: list[str]) -> None:
    spec = tenant_data.get("initial_goal")
    if not spec:
        print("  (skip) no initial_goal in tenant config")
        return
    # Goals are per-OS. Default: apply to the first entitled OS. Tenant can
    # add more goals later via Settings.
    if not entitled_oses:
        print("  (skip) no entitled OSes to attach the goal to")
        return
    os_name = entitled_oses[0]
    _ensure_goal(
        tenant_id=tenant_id,
        os_name=os_name,
        metric=spec["metric"],
        target=float(spec["target"]),
        period=spec.get("period", "month"),
    )


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------
def bootstrap(tenant_id: str) -> None:
    config.load_env()
    tenant_data = config.tenant_yaml(tenant_id)
    entitled = list(tenant_data.get("entitled_oses", []))
    # Filter to live OSes in the registry
    live = set(registry.catalog().keys())
    entitled_live = [o for o in entitled if o in live]
    skipped = [o for o in entitled if o not in live]
    if skipped:
        print(f"  (note) entitled OSes not in platform catalog — skipped: {skipped}")

    print(f"\nBootstrapping tenant {tenant_id!r} — {tenant_data.get('display_name', tenant_id)}")
    print("— tenant row —")
    _ensure_tenant(tenant_id, tenant_data)

    print("— budgets —")
    _seed_budgets(tenant_id, tenant_data, entitled_live)

    print("— goal —")
    _seed_goal(tenant_id, tenant_data, entitled_live)

    sandbox = tenant_data.get("sandbox") or {}
    if sandbox.get("enabled"):
        from governance.sandbox import SandboxConfig
        sb = SandboxConfig.from_tenant(sandbox, tenant_id=tenant_id)
        email = sb.redirect_email or f"<unset: set {sb.redirect_email_env} in .env>"
        phone = sb.redirect_phone or f"<unset: set {sb.redirect_phone_env} in .env>"
        print("\nSandbox is ON:")
        print(f"  outbound email → {email}")
        print(f"  outbound SMS/voice → {phone}")
    print("\nBootstrap complete. Ready to run `make cli` or `make smoke`.")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tenant", required=True)
    args = p.parse_args()
    try:
        bootstrap(args.tenant)
    except FileNotFoundError as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
