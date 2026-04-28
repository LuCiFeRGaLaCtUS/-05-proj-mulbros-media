"""`make onboard TENANT=<slug>` — run the OS's onboarding wizard for a tenant.

If the tenant already has an active config, we run in edit mode: current values
shown as defaults, Enter keeps them. On save, a new `os_config_versions` row
is created, tagged with the actor who ran it.

Usage:
    make onboard TENANT=acme-test OS_NAME=sales
    # or directly:
    ../.venv/bin/python -m apps.cli.onboard --tenant acme-test --os sales
"""
from __future__ import annotations

import argparse
import sys

from platform_os import registry
from shared import config
from shared.db import os_config as cfgdb
from wizards import runner_cli


def main() -> None:
    config.load_env()

    p = argparse.ArgumentParser(prog="platform-cli onboard")
    p.add_argument("--tenant", required=True)
    p.add_argument("--os", dest="os_name", default="sales")
    p.add_argument("--actor", default="operator",
                   help="Name shown in config history as the editor")
    args = p.parse_args()

    # Resolve the OS's config schema (e.g. SalesConfig)
    try:
        os_instance = registry.get(args.os_name)
    except KeyError as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(2)

    schema_cls = os_instance.config_schema
    display_name = os_instance.display_name

    # Existing config in edit mode; empty dict for fresh onboarding.
    active = cfgdb.active(args.tenant, args.os_name)
    existing = active["config_json"] if active else {}
    mode = "edit mode" if active else "fresh onboarding"
    print(f"\n=== {display_name} — {args.tenant} ({mode}) ===")
    if active:
        print(f"Current active version: v{active['version_number']}")

    try:
        instance, raw = runner_cli.run(schema_cls, existing=existing)
    except KeyboardInterrupt:
        print("\ncancelled — no config saved")
        sys.exit(1)

    # Confirm before persisting.
    print("\n— Wizard complete —")
    note = input("Note for version history (optional): ").strip() or None
    ok = input("Save as a new config version? (Y/n) ").strip().lower()
    if ok and ok not in ("y", "yes", ""):
        print("not saved.")
        sys.exit(0)

    saved = cfgdb.save(
        tenant_id=args.tenant,
        os_name=args.os_name,
        config_json=instance.model_dump(exclude_none=False),
        change_note=note or (f"Edit via onboarding wizard" if active else "Initial onboarding"),
        created_by=f"cli:{args.actor}",
    )
    print(f"\n✓ saved new active config v{saved['version_number']}")


if __name__ == "__main__":
    main()
