"""Preflight — verify .env + Supabase + Mem0 are reachable before running.

Exit 0 on success, non-zero with a clear message on any failure.
"""
from __future__ import annotations

import os
import sys

from shared import config


REQUIRED_ENV = [
    "ANTHROPIC_API_KEY",
    "COMPOSIO_MCP_URL",
    "COMPOSIO_API_KEY",
    "MEM0_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
]


def main() -> None:
    config.load_env()
    missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        print(f"FAIL: missing env vars: {', '.join(missing)} — see ../.env.example", file=sys.stderr)
        sys.exit(2)
    print("env: ok")

    # Supabase reachable?
    from shared.db.supabase import client as sb_client
    try:
        sb_client().table("tenants").select("tenant_id").limit(1).execute()
        print("supabase: ok (tenants table reachable)")
    except Exception as e:
        msg = str(e)
        if "tenants" in msg and ("does not exist" in msg or "could not find" in msg.lower()):
            print("supabase: NOT MIGRATED — run `make migrate` first", file=sys.stderr)
            sys.exit(3)
        print(f"supabase: FAIL — {msg}", file=sys.stderr)
        sys.exit(3)

    # Mem0 reachable?
    from shared.memory import mem0
    try:
        mem0.client().search(query="preflight", filters={"user_id": "preflight:ping"}, limit=1)
        print("mem0: ok")
    except Exception as e:
        print(f"mem0: FAIL — {e}", file=sys.stderr)
        sys.exit(4)

    print("\nPreflight OK. Ready.")


if __name__ == "__main__":
    main()
