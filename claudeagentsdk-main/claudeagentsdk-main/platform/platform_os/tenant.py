"""Tenant context loader.

Given a tenant slug, reads config/tenants/<slug>.yaml, cross-references
it with config/platform.yaml (to resolve the catalog of OSes), and
returns a TenantCtx used everywhere downstream.
"""
from __future__ import annotations

from oses._protocol import TenantCtx
from platform_os.registry import catalog
from shared import config


def load(tenant_id: str, session_id: str | None = None, run_id: str | None = None) -> TenantCtx:
    tenant_data = config.tenant_yaml(tenant_id)
    entitled = list(tenant_data.get("entitled_oses", []))
    # Filter entitled against what's actually registered — a tenant can't be
    # entitled to a roadmap-only or missing OS.
    live = set(catalog().keys())
    entitled = [o for o in entitled if o in live]
    return TenantCtx(
        tenant_id=tenant_id,
        display_name=tenant_data.get("display_name", tenant_id),
        entitled_oses=entitled,
        locale=tenant_data.get("locale", "en-US"),
        timezone=tenant_data.get("timezone", "UTC"),
        sandbox=tenant_data.get("sandbox"),
        session_id=session_id,
        run_id=run_id,
    )
