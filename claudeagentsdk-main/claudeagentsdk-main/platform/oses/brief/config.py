"""Brief OS config schema — renders inline in chat as a 4-field wizard.

All four fields are tier `basic`; no Advanced section. The wizard engine
(`wizards/schema_json.py`) auto-renders this the moment a tenant clicks
the Brief OS workspace for the first time, because no active config row
exists yet.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class BriefConfig(BaseModel):
    recipient_name: str = Field(
        default="",
        title="Who's the brief for?",
        description="The name the brief opens with — e.g. 'Avi' or 'the Acme team'.",
        json_schema_extra={"widget": "text", "tier": "basic"},
    )
    sections: list[Literal["pipeline", "opportunities", "budgets", "outreach"]] = Field(
        default_factory=lambda: ["pipeline", "opportunities", "budgets", "outreach"],
        title="Sections to include",
        description="Pick what should show up in every brief.",
        json_schema_extra={"widget": "multi-select", "tier": "basic"},
    )
    tone: Literal["concise", "warm", "data-heavy"] = Field(
        default="concise",
        title="Tone",
        description="How chatty or numerical the brief should sound.",
        json_schema_extra={"widget": "select", "tier": "basic"},
    )
    delivery_email: str | None = Field(
        default=None,
        title="Email it to (optional)",
        description="If set, the brief is also Gmail-sent (sandbox-redirected).",
        json_schema_extra={"widget": "text", "tier": "basic"},
    )
