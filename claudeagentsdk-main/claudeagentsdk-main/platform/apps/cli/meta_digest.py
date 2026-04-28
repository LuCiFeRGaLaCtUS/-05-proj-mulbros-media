"""`make meta-digest TENANT=<slug>` — run the meta-OS opportunity scanner once.

Prints fresh reports to stdout, split by audience (customer / operator), and
persists them to `opportunity_reports`. Phase 2.5 adds a scheduler daemon;
for now this runs on-demand.
"""
from __future__ import annotations

import argparse
import sys

from platform_os import opportunity
from shared import config


def main() -> None:
    config.load_env()
    p = argparse.ArgumentParser(prog="platform-cli meta-digest")
    p.add_argument("--tenant", required=True)
    args = p.parse_args()

    fresh = opportunity.run_for_tenant(args.tenant)
    if not fresh:
        print(f"\n(no new opportunities for {args.tenant})")
        return

    customer = [r for r in fresh if r.audience == "customer"]
    operator = [r for r in fresh if r.audience == "operator"]

    if customer:
        print(f"\n━━━ {len(customer)} customer-facing report(s) — {args.tenant} ━━━")
        for r in customer:
            icon = {"warning": "⚠️", "opportunity": "✨", "info": "•"}.get(r.severity, "·")
            print(f"\n{icon} [{r.pattern}] {r.headline}")
            if r.body:
                print(f"   {r.body}")

    if operator:
        print(f"\n━━━ {len(operator)} operator-facing pitch report(s) ━━━")
        for r in operator:
            print(f"\n💰 [{r.pattern}] {r.headline}")
            if r.body:
                print(f"   {r.body}")

    print(f"\n({len(fresh)} total — persisted to opportunity_reports)")


if __name__ == "__main__":
    main()
