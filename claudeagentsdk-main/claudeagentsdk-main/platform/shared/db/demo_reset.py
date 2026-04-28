"""Wipe a tenant's operational state so the next demo starts clean.

What gets wiped:
    - leads                     (cascades to outreach_events via FK)
    - chat_sessions             (cascades to chat_messages + hitl_requests)
    - opportunity_reports
    - variance_alerts
    - os_events
    - Budget `consumed` reset to 0 for active-period rows
    - Goal  `current_value` reset to 0 for active-period rows

What is preserved:
    - tenants                   (the tenant itself)
    - os_config_versions        (config history is part of the operator's record)
    - branding / platform.yaml  (obviously)
    - audit_events              (immutable — this is the security record)

Destructive; requires explicit --yes (or answer "yes" at the prompt).

Usage:
    python -m shared.db.demo_reset --tenant acme-test --yes
"""
from __future__ import annotations

import argparse
import sys

from shared import config, logging as plog
from shared.db.supabase import client, table

log = plog.get("demo_reset")


def _count(t: str, tenant: str) -> int:
    res = client().table(t).select("id", count="exact").eq("tenant_id", tenant).limit(1).execute()
    return res.count or 0


def _delete(t: str, tenant: str, label: str) -> int:
    before = _count(t, tenant)
    if before == 0:
        print(f"  (skip) {label}: already empty")
        return 0
    # Supabase requires a filter on delete — tenant_id works everywhere.
    table(t).delete().eq("tenant_id", tenant).execute()
    print(f"  - {label}: deleted {before} row(s)")
    return before


def _reset_budgets(tenant: str) -> int:
    rows = (
        table("external_budgets").select("id,resource_key,consumed").eq("tenant_id", tenant).execute()
    ).data or []
    reset = 0
    for r in rows:
        if float(r.get("consumed") or 0) > 0:
            table("external_budgets").update({"consumed": 0}).eq("id", r["id"]).execute()
            reset += 1
    if reset:
        print(f"  - budgets: reset consumed=0 on {reset} row(s)")
    else:
        print("  (skip) budgets: already at zero")
    return reset


def _reset_goals(tenant: str) -> int:
    rows = (
        table("goals").select("id,metric_name,current_value").eq("tenant_id", tenant).execute()
    ).data or []
    reset = 0
    for r in rows:
        if float(r.get("current_value") or 0) > 0:
            table("goals").update({"current_value": 0}).eq("id", r["id"]).execute()
            reset += 1
    if reset:
        print(f"  - goals: reset current_value=0 on {reset} row(s)")
    else:
        print("  (skip) goals: already at zero")
    return reset


def reset(tenant: str) -> None:
    config.load_env()
    print(f"\nResetting operational state for tenant {tenant!r}")
    # Deletion order: FK-dependent tables first. Cascades handle the rest.
    _delete("outreach_events",     tenant, "outreach_events")       # before leads
    _delete("leads",               tenant, "leads")
    _delete("chat_messages",       tenant, "chat_messages")          # denormalized tenant_id
    _delete("hitl_requests",       tenant, "hitl_requests")
    _delete("chat_sessions",       tenant, "chat_sessions")
    _delete("opportunity_reports", tenant, "opportunity_reports")
    _delete("variance_alerts",     tenant, "variance_alerts")
    _delete("os_events",           tenant, "os_events")
    _reset_budgets(tenant)
    _reset_goals(tenant)
    print(f"\n✓ Tenant {tenant!r} is back to a clean starting state.")
    print("  Preserved: tenant config, os_config_versions, audit_events.")
    print("  Next: `make demo-seed` to re-insert demo leads, or `make cli` for a clean run.")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tenant", required=True)
    p.add_argument("--yes", action="store_true",
                   help="Skip the 'are you sure' prompt (for scripts)")
    args = p.parse_args()

    if not args.yes:
        ans = input(f"Really wipe operational state for tenant {args.tenant!r}? [type 'yes'] ")
        if ans.strip().lower() != "yes":
            print("cancelled.")
            sys.exit(1)

    reset(args.tenant)


if __name__ == "__main__":
    main()
