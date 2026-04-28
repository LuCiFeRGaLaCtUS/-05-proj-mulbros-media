"""Supabase client helpers. All DB access goes through here.

Tenant discipline: callers pass tenant_id explicitly. We don't enforce it with
RLS yet (single-tenant deploys), but the API is shaped so future RLS is drop-in.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from shared import config


@lru_cache(maxsize=1)
def client() -> Client:
    """Shared Supabase client. Uses the service role key — do NOT expose this
    to any non-trusted context."""
    config.load_env()
    url = config.require_env("SUPABASE_URL")
    key = config.require_env("SUPABASE_KEY")
    return create_client(url, key)


def table(name: str):
    """Handy shortcut. Always use .eq('tenant_id', tenant_id) or .match({'tenant_id': ...})."""
    return client().table(name)


def tenant_scoped(table_name: str, tenant_id: str):
    """Returns a select builder already filtered by tenant_id. Use for reads."""
    return table(table_name).select("*").eq("tenant_id", tenant_id)


def insert_with_tenant(table_name: str, tenant_id: str, row: dict[str, Any]) -> Any:
    """Insert ensuring tenant_id is stamped on the row."""
    row = {**row, "tenant_id": tenant_id}
    return table(table_name).insert(row).execute()
