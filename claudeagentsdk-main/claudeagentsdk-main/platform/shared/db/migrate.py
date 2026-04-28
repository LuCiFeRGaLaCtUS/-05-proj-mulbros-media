"""Simple migration runner.

Reads every `.sql` file under:
    - platform/shared/db/migrations/
    - platform/oses/*/migrations/

...in lexical order and executes each against Supabase via the REST RPC
`exec_sql(sql text)`. The RPC needs to exist in the project — see README.

For Phase 0 we keep it dumb: no tracking table, SQL must be idempotent
(`create table if not exists`, `create index if not exists`, etc.). All our
migrations are written this way.
"""
from __future__ import annotations

import sys
from pathlib import Path

from shared import config
from shared.db.supabase import client


def _collect_migrations() -> list[Path]:
    platform_root = Path(__file__).resolve().parents[2]
    paths: list[Path] = []
    paths.extend(sorted((platform_root / "shared" / "db" / "migrations").glob("*.sql")))
    for os_dir in sorted((platform_root / "oses").iterdir()):
        if not os_dir.is_dir() or os_dir.name.startswith("_"):
            continue
        paths.extend(sorted((os_dir / "migrations").glob("*.sql")))
    return paths


def _run_sql(sql: str) -> None:
    """Execute SQL via the Supabase REST RPC `exec_sql`.

    Requires the RPC to be installed in the project:
        create or replace function exec_sql(sql text) returns void
        language plpgsql security definer as $$ begin execute sql; end $$;

    If the RPC doesn't exist yet, we print instructions and exit so the user
    can install it via the Supabase SQL editor. We deliberately don't try
    to create it ourselves — it's a security-sensitive primitive.
    """
    try:
        client().rpc("exec_sql", {"sql": sql}).execute()
    except Exception as e:
        low = str(e).lower()
        if "exec_sql" in low and ("does not exist" in low or "could not find" in low
                                  or "pgrst202" in low):
            print(
                "\nMissing RPC `exec_sql`. Install it once via the Supabase SQL editor:\n\n"
                "    create or replace function exec_sql(sql text) returns void\n"
                "    language plpgsql security definer as $$\n"
                "    begin execute sql; end $$;\n\n"
                "Then re-run `make migrate` (or `make bootstrap`).\n",
                file=sys.stderr,
            )
            sys.exit(2)
        raise


def main() -> None:
    config.load_env()
    paths = _collect_migrations()
    if not paths:
        print("No migrations found.")
        return
    for p in paths:
        _run_sql(p.read_text())
        print(f"  ✓ {p.relative_to(Path(__file__).resolve().parents[2].parent)}")
    print(f"done — {len(paths)} migration(s) applied")


if __name__ == "__main__":
    main()
