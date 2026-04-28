"""OS config versioning — append-only CRUD over `os_config_versions`.

Every save of an OS's config (ICP, branding, pacing overrides, prompt pins,
skill pins) inserts a new row. The latest `is_active=true` row is "current".
Rollback = flip `is_active` to a previous row's id (and we also insert a new
row that COPIES the restored config — so history stays linear and auditable,
not a tangle of toggled flags).

Used by:
    - The wizard engine (Phase 1+) on save.
    - CLI `apps.cli config restore ...`.
    - Runtime: shared.versions.active_config() reads the active row.
"""
from __future__ import annotations

from typing import Any

from shared import logging as plog
from shared.db.supabase import client, table

log = plog.get("shared.db.os_config")


def list_versions(tenant_id: str, os_name: str, limit: int = 50) -> list[dict]:
    """Most-recent-first list of this tenant+OS's config versions."""
    res = (
        table("os_config_versions")
        .select("id, version_number, created_at, created_by, change_note, is_active")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .order("version_number", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def get_version(tenant_id: str, os_name: str, version_number: int) -> dict | None:
    """Fetch one historic version by its number."""
    res = (
        table("os_config_versions")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("version_number", version_number)
        .limit(1)
        .execute()
    )
    return (res.data or [None])[0]


def active(tenant_id: str, os_name: str) -> dict | None:
    """Currently-active version row."""
    res = (
        table("os_config_versions")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    return (res.data or [None])[0]


def _next_version_number(tenant_id: str, os_name: str) -> int:
    res = (
        table("os_config_versions")
        .select("version_number")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .order("version_number", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return 1
    return int(res.data[0]["version_number"]) + 1


def save(
    tenant_id: str,
    os_name: str,
    config_json: dict[str, Any],
    *,
    change_note: str | None = None,
    created_by: str = "system",
) -> dict:
    """Insert a new config version and make it active. Deactivates any prior active row.

    Supabase doesn't have a cheap transactional primitive exposed to us here,
    so we do it in two writes: deactivate-then-insert. If the insert fails
    the user is left with no active row — which is loud and easy to spot,
    preferable to silent drift. Phase 1 can wrap this in a Postgres RPC for
    atomicity.
    """
    # Deactivate prior active row(s).
    table("os_config_versions").update({"is_active": False}).eq(
        "tenant_id", tenant_id
    ).eq("os_name", os_name).eq("is_active", True).execute()

    new_version = _next_version_number(tenant_id, os_name)
    row = {
        "tenant_id": tenant_id,
        "os_name": os_name,
        "version_number": new_version,
        "config_json": config_json,
        "change_note": change_note,
        "created_by": created_by,
        "is_active": True,
    }
    res = table("os_config_versions").insert(row).execute()
    return (res.data or [row])[0]


def restore(tenant_id: str, os_name: str, version_number: int, *,
            created_by: str = "system") -> dict:
    """Restore a prior version by copying its config_json into a new row (preserves
    linear history) and activating the new row."""
    prior = get_version(tenant_id, os_name, version_number)
    if prior is None:
        raise ValueError(f"version {version_number} does not exist for {tenant_id}/{os_name}")
    return save(
        tenant_id,
        os_name,
        prior["config_json"],
        change_note=f"Restored from v{version_number}",
        created_by=created_by,
    )
