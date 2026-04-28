"""Sales OS config schema — renders into the onboarding wizard (9 steps)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# ICP — what we sell to
# ---------------------------------------------------------------------------
class ICP(BaseModel):
    titles: list[str] = Field(
        default_factory=list,
        title="Target titles",
        description="Roles of the people we want to reach.",
        json_schema_extra={"widget": "tag-list",
                           "examples": ["VP Sales", "Head of Revenue", "CRO"]},
    )
    industries: list[str] = Field(
        default_factory=list,
        title="Industries",
        json_schema_extra={"widget": "tag-list",
                           "examples": ["Fintech", "Devtools", "Healthcare SaaS"]},
    )
    company_size_band: Literal["1-10", "11-50", "51-200", "201-1000", "1000+"] | None = Field(
        default=None,
        title="Company size",
        json_schema_extra={"widget": "select"},
    )
    geos: list[str] = Field(
        default_factory=list,
        title="Geographies",
        json_schema_extra={"widget": "tag-list", "examples": ["UK", "EU", "US-East"]},
    )
    signals: list[str] = Field(
        default_factory=list,
        title="Intent signals",
        description="Things that indicate a company is in-market right now.",
        json_schema_extra={"widget": "tag-list",
                           "tier": "advanced",
                           "examples": ["Fresh Series B", "Hiring sales reps", "New CRO"]},
    )


# ---------------------------------------------------------------------------
# Pricing / outreach
# ---------------------------------------------------------------------------
class Pricing(BaseModel):
    avg_deal_size_usd: float | None = Field(
        default=None,
        title="Average deal size (USD)",
        json_schema_extra={"widget": "number", "tier": "advanced"},
    )
    sales_cycle_days: int | None = Field(
        default=None,
        title="Typical sales cycle (days)",
        json_schema_extra={"widget": "number", "tier": "advanced"},
    )


class OutreachRules(BaseModel):
    channels: list[Literal["email", "sms", "voice"]] = Field(
        default_factory=lambda: ["email"],
        title="Outreach channels",
        json_schema_extra={"widget": "multi-select"},
    )
    require_approval_before_first_outbound: bool = Field(
        default=True,
        title="Require my approval before first outbound to a new ICP",
        json_schema_extra={"widget": "toggle"},
    )
    tone: Literal["warm", "direct", "playful", "formal"] = Field(
        default="warm",
        title="Outreach tone",
        json_schema_extra={"widget": "select"},
    )


# ---------------------------------------------------------------------------
# Identity (from Samira/Nova template)
# ---------------------------------------------------------------------------
class Identity(BaseModel):
    display_name: str = Field(
        default="Sales OS",
        title="What should we call this workspace?",
        description="e.g. 'ACME Sales Platform' or 'Nova'.",
        json_schema_extra={"widget": "text"},
    )
    avatar_image_url: str | None = Field(
        default=None,
        title="Avatar image",
        description="Upload any image you like — your photo, an illustration, a portrait.",
        json_schema_extra={"widget": "image-upload"},
    )
    voice_sample_url: str | None = Field(
        default=None,
        title="Voice sample (15s)",
        json_schema_extra={"widget": "voice-record", "duration_s": 15},
    )
    personality_note: str | None = Field(
        default=None,
        title="Personality note (optional)",
        description="One line about how your OS should sound. Defaults are fine.",
        json_schema_extra={"widget": "text", "tier": "advanced"},
    )


# ---------------------------------------------------------------------------
# Knowledge (website + brand assets)
# ---------------------------------------------------------------------------
class Knowledge(BaseModel):
    website_url: str | None = Field(
        default=None,
        title="Your website",
        description="We'll absorb your public context from here.",
        json_schema_extra={"widget": "url"},
    )
    brand_asset_urls: list[str] = Field(
        default_factory=list,
        title="Brand assets",
        description="Paste links to case studies, decks, videos, or drop files.",
        json_schema_extra={"widget": "link-list"},
    )


# ---------------------------------------------------------------------------
# Goals — the north-star for pacing
# ---------------------------------------------------------------------------
class Goals(BaseModel):
    north_star_metric: Literal["new_leads", "qualified_trials", "meetings_booked", "new_mrr_usd"] = Field(
        default="new_leads",
        title="Primary metric",
        json_schema_extra={"widget": "select", "north_star": True},
    )
    target_value: float = Field(
        default=50,
        title="Target value",
        json_schema_extra={"widget": "number"},
    )
    period: Literal["day", "week", "month", "quarter"] = Field(
        default="month",
        title="Period",
        json_schema_extra={"widget": "select"},
    )


# ---------------------------------------------------------------------------
# The full schema. Ordering here determines the wizard step sequence.
# ---------------------------------------------------------------------------
class SalesConfig(BaseModel):
    identity: Identity = Field(default_factory=Identity)
    knowledge: Knowledge = Field(default_factory=Knowledge)
    icp: ICP = Field(default_factory=ICP)
    pricing: Pricing = Field(default_factory=Pricing)
    outreach: OutreachRules = Field(default_factory=OutreachRules)
    goals: Goals = Field(default_factory=Goals)
