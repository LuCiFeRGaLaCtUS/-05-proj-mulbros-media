"""Version resolution — one place to ask "what versions are live for this tenant?".

The platform has three kinds of versionable artifacts:

    1. Agent prompts — markdown files under oses/<os>/agents/<agent>/prompts/v*.md.
       Each subagent's definition.py declares a default PROMPT_VERSION.
       Tenant config can override via:
           config.prompt_pins.<agent_name> = "<version>"

    2. Skills — markdown files under skills/*.md (or oses/<os>/skills/*.md).
       Each has `version:` in frontmatter. Multiple versions can coexist.
       Tenant config can override via:
           config.skill_pins.<skill_name> = "<version>"

    3. OS configs — JSON stored in Supabase `os_config_versions`, append-only.
       The active row (is_active=true) is "current". Restoring a prior
       version means inserting a new row copying the old config + flipping
       is_active.

This module gives a single `active_manifest(tenant_id, os_name)` that returns
a frozen snapshot of all three kinds. That snapshot is written into every
`audit_events.version_manifest` so any historical run can be reproduced.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from functools import lru_cache
from typing import Any

from shared import config
from shared.db.supabase import table


@dataclass(frozen=True)
class VersionManifest:
    """What was 'live' at a given moment for a tenant+OS.

    Put in audit_events.version_manifest to make runs reproducible.
    """
    tenant_id: str
    os_name: str
    prompt_versions: dict[str, str] = field(default_factory=dict)   # {agent_name: version}
    skill_versions:  dict[str, str] = field(default_factory=dict)   # {skill_name: version}
    config_version:  int | None = None                               # os_config_versions.version_number
    config_id:       str | None = None                               # os_config_versions.id

    def as_json(self) -> dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Agent prompt versions
# ---------------------------------------------------------------------------
def _prompt_pins(tenant_id: str, os_name: str) -> dict[str, str]:
    """Per-tenant prompt pinning lives inside the tenant's active OS config.
    Falls back to empty dict when no pins set."""
    cfg = active_config(tenant_id, os_name) or {}
    pins = cfg.get("prompt_pins")
    return pins if isinstance(pins, dict) else {}


def active_prompt_versions(tenant_id: str, os_name: str) -> dict[str, str]:
    """Resolve {agent_name: version} using pins over defaults."""
    out: dict[str, str] = {}
    pins = _prompt_pins(tenant_id, os_name)
    # Defaults come from each subagent's definition.PROMPT_VERSION.
    if os_name == "sales":
        from oses.sales.agents import discover
        for agent_name, (_defn, spec) in discover().items():
            out[agent_name] = pins.get(agent_name, spec.prompt_version)
    return out


# ---------------------------------------------------------------------------
# Skill versions
# ---------------------------------------------------------------------------
def _skill_pins(tenant_id: str, os_name: str) -> dict[str, str]:
    cfg = active_config(tenant_id, os_name) or {}
    pins = cfg.get("skill_pins")
    return pins if isinstance(pins, dict) else {}


def active_skill_versions(tenant_id: str, os_name: str) -> dict[str, str]:
    """Resolve {skill_name: version} using pins; falls back to latest stable per skill."""
    from skills import _loader as skills
    out: dict[str, str] = {}
    pins = _skill_pins(tenant_id, os_name)
    seen_names: set[str] = set()
    for (name, _version) in skills.catalog().keys():
        if name in seen_names:
            continue
        seen_names.add(name)
        resolved = skills.get(name, version=pins.get(name))
        if resolved:
            out[name] = resolved.version
    return out


# ---------------------------------------------------------------------------
# OS config versions (Supabase-backed)
# ---------------------------------------------------------------------------
def active_config_row(tenant_id: str, os_name: str) -> dict[str, Any] | None:
    """Return the active os_config_versions row, or None if none set."""
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


def active_config(tenant_id: str, os_name: str) -> dict[str, Any] | None:
    """Return the active config_json only."""
    row = active_config_row(tenant_id, os_name)
    return row["config_json"] if row else None


# ---------------------------------------------------------------------------
# Manifest assembly
# ---------------------------------------------------------------------------
def active_manifest(tenant_id: str, os_name: str) -> VersionManifest:
    """Snapshot of every versioned artifact currently live for this tenant+OS."""
    row = active_config_row(tenant_id, os_name)
    return VersionManifest(
        tenant_id=tenant_id,
        os_name=os_name,
        prompt_versions=active_prompt_versions(tenant_id, os_name),
        skill_versions=active_skill_versions(tenant_id, os_name),
        config_version=(row["version_number"] if row else None),
        config_id=(row["id"] if row else None),
    )
