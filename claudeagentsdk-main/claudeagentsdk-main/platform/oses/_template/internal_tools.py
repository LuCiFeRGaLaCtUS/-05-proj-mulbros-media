"""Template OS — internal-only @governed tools.

Pattern: every tool function wraps with @governed from governance.middleware.
Tools take ACTION (write to DB, call mem0, update status). Logic that requires
JUDGMENT belongs in a skill, not a tool.

Mirror oses/sales/internal_tools.py for the canonical shape.
"""
from __future__ import annotations

from governance.middleware import governed


# Example shape — replace with the tools your OS needs.
@governed(name="mcp__template_os_internal__list_things", cost=None)
async def list_things(tenant_id: str, status: str | None = None) -> list[dict]:
    """Stub. Replace with real implementation that queries Supabase."""
    raise NotImplementedError
