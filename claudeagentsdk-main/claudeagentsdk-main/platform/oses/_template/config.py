"""Template OS — tenant config schema.

Replace this with the actual config fields your OS needs. The wizard auto-generates
its UI from this schema; keep field types and Field(...) descriptions tight.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class TemplateOsConfig(BaseModel):
    """Per-tenant config for Template OS. Stored in os_configs as JSONB."""

    # Example field — replace with real ones for your OS.
    enabled: bool = Field(
        default=True,
        description="Whether this OS is currently active for the tenant.",
    )
