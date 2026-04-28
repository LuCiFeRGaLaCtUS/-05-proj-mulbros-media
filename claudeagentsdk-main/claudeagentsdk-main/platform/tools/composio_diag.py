"""Composio connection diagnostic.

Lists all connected accounts visible to your COMPOSIO_SDK_API_KEY (or
COMPOSIO_API_KEY as fallback). Use this to figure out which user_id Gmail
is connected under, so send_email can target the right account.

Usage:
    cd platform && ../.venv/bin/python -m tools.composio_diag
"""
from __future__ import annotations

import json
import os
import sys

from shared import config


def main() -> None:
    config.load_env()

    try:
        from tools.composio import _client, ComposioNotConfigured
    except ImportError as e:
        print(f"import failed: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        c = _client()
    except ComposioNotConfigured as e:
        print(f"not configured: {e}", file=sys.stderr)
        sys.exit(2)

    key_name = "COMPOSIO_SDK_API_KEY" if os.environ.get("COMPOSIO_SDK_API_KEY") else "COMPOSIO_API_KEY"
    print(f"Using {key_name} for SDK calls.\n")

    # List connected accounts.
    try:
        accounts_page = c.connected_accounts.list()
    except Exception as e:
        print(f"ERROR listing connected_accounts: {e}", file=sys.stderr)
        print("\nMost likely: the API key is scoped to a project/workspace that"
              " has no connected accounts, or the key lacks permissions.")
        sys.exit(3)

    # `list()` returns a paginated container — try common shapes.
    items: list = []
    if hasattr(accounts_page, "items"):
        items = list(accounts_page.items)
    elif isinstance(accounts_page, list):
        items = accounts_page
    else:
        # Try iterating
        try:
            items = list(accounts_page)
        except Exception:
            items = []

    print(f"Found {len(items)} connected account(s):\n")
    if not items:
        print("  (no connections visible under this API key)")
        print()
        print("This is the root cause: the Developer API key is scoped to a workspace")
        print("that has no Gmail connection. Two options:")
        print("  1. Connect Gmail in the workspace this Developer key belongs to.")
        print("  2. Use a Developer key from the same workspace your Consumer key uses.")
        return

    for i, acct in enumerate(items, 1):
        # Try common field names.
        def _get(obj, name, default="?"):
            if hasattr(obj, name):
                return getattr(obj, name)
            if isinstance(obj, dict):
                return obj.get(name, default)
            return default

        acct_id = _get(acct, "id", "?")
        toolkit = _get(acct, "toolkit_slug") or _get(acct, "app") or _get(acct, "toolkit")
        user_id = _get(acct, "user_id") or _get(acct, "entity_id")
        status = _get(acct, "status", "?")

        print(f"  [{i}] id={acct_id}")
        print(f"       toolkit: {toolkit}")
        print(f"       user_id: {user_id}")
        print(f"       status:  {status}")

    # Highlight Gmail specifically.
    gmail_accounts = [a for a in items if "gmail" in str(
        getattr(a, "toolkit_slug", None) or
        (a.get("toolkit_slug") if isinstance(a, dict) else "") or
        getattr(a, "app", None) or
        (a.get("app") if isinstance(a, dict) else "") or ""
    ).lower()]

    print()
    if gmail_accounts:
        print(f"✓ Gmail connection(s) found: {len(gmail_accounts)}")
        a = gmail_accounts[0]
        user_id = (getattr(a, "user_id", None) or
                   (a.get("user_id") if isinstance(a, dict) else None) or
                   getattr(a, "entity_id", None) or
                   (a.get("entity_id") if isinstance(a, dict) else None))
        print(f"  → set COMPOSIO_USER_ID={user_id} in .env and re-run `make demo-smoke`")
    else:
        print("✗ No Gmail connection under this API key's workspace.")
        print("  Either connect Gmail here, or use a key from the workspace that has it.")


if __name__ == "__main__":
    main()
