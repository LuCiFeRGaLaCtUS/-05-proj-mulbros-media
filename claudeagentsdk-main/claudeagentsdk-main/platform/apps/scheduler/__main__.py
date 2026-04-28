"""Local scheduler daemon — runs the meta-OS digest on a cadence per tenant.

Why a daemon (not pg_cron): we're local-first; Supabase pg_cron requires
Supabase Edge Functions plus a scheduled-job-to-Python bridge. A tiny Python
loop is simpler to reason about and matches the "no deploy required" promise.

    make scheduler         — long-running loop (daily by default)
    make scheduler-once    — one pass over all tenants, then exit (useful for CI or manual)
    python -m apps.scheduler --interval-seconds 3600 --verbose

Tenants are discovered each tick from `config/tenants/*.yaml`, so adding a
new tenant doesn't require a scheduler restart.
"""
from __future__ import annotations

import argparse
import signal
import sys
import time
from pathlib import Path

from platform_os import opportunity
from shared import config, logging as plog

log = plog.get("apps.scheduler")


_STOP = False


def _handle_sigterm(_signum, _frame):
    global _STOP
    _STOP = True
    print("\n(received shutdown signal — finishing current tick and exiting)", file=sys.stderr)


def _tenant_slugs() -> list[str]:
    """All tenant slugs by file discovery. Lightweight — one directory scan."""
    tenants_dir = Path(config.CONFIG_DIR) / "tenants"
    if not tenants_dir.exists():
        return []
    return sorted(p.stem for p in tenants_dir.glob("*.yaml") if not p.stem.startswith("_"))


def _tick(verbose: bool = False) -> dict[str, int]:
    """One pass over all tenants. Returns {tenant: new_report_count}.
    Also dispatches any due cadence touches (runs BEFORE the opportunity
    scanner so that anything sent this tick shows up in the same digest)."""
    out: dict[str, int] = {}
    for slug in _tenant_slugs():
        try:
            sent = _dispatch_due_cadence(slug, verbose=verbose)
            fresh = opportunity.run_for_tenant(slug)
            out[slug] = len(fresh)
            if verbose or fresh or sent:
                print(f"  {slug}: {len(fresh)} new report(s); {sent} cadence touch(es) dispatched")
        except Exception as e:
            plog.event(log, "scheduler.tick_failed", tenant=slug, err=str(e))
            out[slug] = -1
    return out


def _dispatch_due_cadence(tenant: str, verbose: bool = False) -> int:
    """Find due cadence rows for a tenant and fire each as an orchestrator run.
    Marks the row sent/failed based on outcome. Returns count attempted.

    This runs synchronously within the tick — each cadence touch takes ~30s of
    LLM work. For low-volume local dev that's fine. When volume grows, swap
    to a worker queue (Celery/dramatiq) so ticks stay snappy.
    """
    from shared.db import cadence
    due = cadence.list_due(tenant_id=tenant, limit=20)
    if not due:
        return 0

    import asyncio
    from oses.sales import handle_async
    from platform_os import tenant as tenant_mod
    from shared.db import chat as chat_db

    async def _run_one(row: dict) -> None:
        sid = None
        try:
            # Open a session named after the touch so the UI shows what ran.
            sess = chat_db.create_session(
                tenant_id=tenant, os_name="sales",
                title=f"Cadence touch #{row['touch_number']} ({row['pattern']})",
            )
            sid = sess["id"]
            tctx = tenant_mod.load(tenant, session_id=sid)
            brief = cadence.build_touch_brief(row)
            async for _ in handle_async(brief, tctx):
                pass
            cadence.mark_sent(row["id"])
        except Exception as e:
            plog.event(log, "cadence.dispatch_failed", row_id=row["id"], err=str(e))
            cadence.mark_failed(row["id"], reason=str(e)[:200])

    async def _run_all() -> None:
        for row in due:
            await _run_one(row)

    try:
        asyncio.run(_run_all())
    except Exception as e:
        plog.event(log, "cadence.batch_failed", tenant=tenant, err=str(e))
    return len(due)


def main() -> None:
    config.load_env()
    p = argparse.ArgumentParser(prog="platform-scheduler")
    p.add_argument("--interval-seconds", type=int, default=86400,
                   help="Seconds between ticks (default 86400 = daily). Set to 60 for dev.")
    p.add_argument("--once", action="store_true",
                   help="Run one tick over all tenants then exit.")
    p.add_argument("--verbose", action="store_true",
                   help="Print a line per tenant even when no new reports.")
    args = p.parse_args()

    signal.signal(signal.SIGINT,  _handle_sigterm)
    signal.signal(signal.SIGTERM, _handle_sigterm)

    if args.once:
        print(f"— meta-OS scheduler: one tick over {len(_tenant_slugs())} tenant(s) —")
        results = _tick(verbose=args.verbose)
        total = sum(v for v in results.values() if v > 0)
        print(f"\n({total} new report(s) across all tenants)")
        return

    print(f"— meta-OS scheduler running — interval={args.interval_seconds}s "
          f"({len(_tenant_slugs())} tenant(s)) —")
    print("  Ctrl-C to stop.")

    while not _STOP:
        results = _tick(verbose=args.verbose)
        total = sum(v for v in results.values() if v > 0)
        if args.verbose or total > 0:
            print(f"  tick @ {time.strftime('%H:%M:%S')} — {total} new report(s)")
        # Interruptible sleep — checks _STOP every second for clean shutdown.
        elapsed = 0
        while elapsed < args.interval_seconds and not _STOP:
            time.sleep(1)
            elapsed += 1


if __name__ == "__main__":
    main()
