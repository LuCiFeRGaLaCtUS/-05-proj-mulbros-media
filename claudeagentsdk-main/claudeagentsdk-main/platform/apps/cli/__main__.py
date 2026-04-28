"""CLI entry point — run a Sales OS brief end-to-end.

Phase 0 shape: one-shot `--brief "..."` mode. A real chat REPL lands in Phase 1.

Usage:
    python -m apps.cli --tenant acme-test --os sales --brief "Source 3 leads…"
    # or interactive prompt:
    python -m apps.cli --tenant acme-test --os sales

Outputs plain-language activity lines (agent traces translated via chat/translations.py),
text responses from the OS, and a final cost/turns summary.
"""
from __future__ import annotations

import argparse
import asyncio
import sys

from chat.translations import humanize
from governance import sandbox as _sandbox
from platform_os import registry, tenant as tenant_mod
from shared import logging as plog


def _print(msg: str) -> None:
    print(msg, flush=True)


def _print_mcp_status(data: dict) -> None:
    servers = data.get("mcp_servers", []) if isinstance(data, dict) else []
    for s in servers:
        name = s.get("name")
        status = s.get("status")
        mark = "✓" if status == "connected" else f"({status})"
        _print(f"  {mark} {name}")


async def _run(tenant_id: str, os_name: str, brief: str) -> int:
    run_id = plog.new_run_id()
    ctx = tenant_mod.load(tenant_id, run_id=run_id)

    if os_name not in ctx.entitled_oses:
        _print(f"Tenant {tenant_id!r} is not entitled to OS {os_name!r}. "
               f"Entitled: {ctx.entitled_oses}")
        return 2

    os_instance = registry.get(os_name)
    os_instance.bootstrap(ctx)

    # Branding header
    _print(f"\n— {ctx.display_name} · {os_instance.display_name} —")
    if ctx.sandbox and ctx.sandbox.get("enabled"):
        sb = _sandbox.SandboxConfig.from_tenant(ctx.sandbox, tenant_id=tenant_id)
        email = sb.redirect_email or f"<unset: {sb.redirect_email_env or 'redirect_email'}>"
        phone = sb.redirect_phone or f"<unset: {sb.redirect_phone_env or 'redirect_phone'}>"
        _print(f"  SANDBOX MODE: outbound → {email} / {phone}")
    _print("")

    # Phase 0 only supports the Sales OS streaming path.
    if os_name != "sales":
        _print(f"OS {os_name!r} doesn't have a streaming handler yet.")
        return 2

    from oses.sales import handle_async

    final_turns = None
    final_cost = None
    async for event in handle_async(brief, ctx):
        kind = event.get("kind")
        if kind == "system.init":
            _print("Connecting to providers…")
            _print_mcp_status(event.get("data", {}))
            _print("")
        elif kind == "text":
            _print(event["text"])
        elif kind == "tool_use":
            _print(f"  … {humanize(event['name'])}")
        elif kind == "result":
            final_turns = event.get("turns")
            final_cost = event.get("cost_usd")

    if final_turns is not None:
        _print(f"\n— done in {final_turns} turns · ${float(final_cost or 0):.4f} —")
    return 0


def _print_startup_banner() -> None:
    """Validate sandbox setup once. Prints a banner in dev/staging when env vars
    are unset; raises in prod when any tenant has sandbox enabled."""
    warnings = _sandbox.startup_check_all_tenants()
    banner = _sandbox.format_startup_banner(warnings)
    if banner:
        print(banner, flush=True)


def main() -> None:
    _print_startup_banner()

    parser = argparse.ArgumentParser(prog="platform-cli")
    parser.add_argument("--tenant", required=True, help="Tenant slug (config/tenants/<slug>.yaml)")
    parser.add_argument("--os", dest="os_name", default="sales", help="OS to target")
    parser.add_argument("--brief", default=None, help="One-shot brief. Omit for interactive prompt.")
    args = parser.parse_args()

    brief = args.brief
    if not brief:
        try:
            brief = input(f"[{args.tenant}/{args.os_name}] > ").strip()
        except EOFError:
            sys.exit(0)
        if not brief:
            sys.exit(0)

    code = asyncio.run(_run(args.tenant, args.os_name, brief))
    sys.exit(code)


if __name__ == "__main__":
    main()
