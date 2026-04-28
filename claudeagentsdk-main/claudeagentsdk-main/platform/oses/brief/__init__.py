"""Brief OS entrypoint — the platform's plug-and-play proof.

A deliberately minimal OS: one subagent (`briefer`) that reads cross-OS state
(Sales OS leads, opportunity reports, budgets, recent outreach) and produces a
personalized markdown briefing. Demonstrates that adding a new OS is a matter
of dropping a module under `oses/` plus two YAML lines, with the wizard,
sidebar, dashboard, and governance picking it up automatically.
"""
from __future__ import annotations

from typing import Any

from oses._protocol import OS, OSResult, ResourceSpec, SubagentSpec, TenantCtx
from oses.brief import orchestrator
from oses.brief.agents import agent_specs
from oses.brief.config import BriefConfig


NAME = "brief"
DISPLAY_NAME = "Brief OS"
VERSION = "0.1.0"


# Suggestion chips shown in the onboarding wizard's "Name your AI operator" step.
NAME_SUGGESTIONS = ["Pulse", "Compass", "Daybreak", "Ledger", "Almanac"]


# Brief OS only consumes Gmail when delivery_email is set; reuses the Sales OS
# Gmail budget rather than declaring its own ledger row.
RESOURCES: list[ResourceSpec] = [
    ResourceSpec(key="gmail_sends", display_name="Gmail sends",
                 unit="emails", default_period="day", ask_user_for_limit=False),
]


class _BriefOS:
    name = NAME
    display_name = DISPLAY_NAME
    version = VERSION
    config_schema = BriefConfig
    name_suggestions = NAME_SUGGESTIONS
    resources = RESOURCES

    def bootstrap(self, ctx: TenantCtx) -> None:
        # No-op. The wizard covers config; migrations cover the briefs table.
        pass

    def handle(self, brief: str, ctx: TenantCtx) -> OSResult:
        raise NotImplementedError(
            "Use oses.brief.handle_async() for streaming."
        )

    def health(self, ctx: TenantCtx) -> dict[str, Any]:
        return {"status": "ok", "version": VERSION,
                "subagents": [s.name for s in agent_specs()]}

    def subagents(self) -> list[SubagentSpec]:
        return agent_specs()


OS_INSTANCE: OS = _BriefOS()


async def handle_async(brief: str, ctx: TenantCtx):
    """Async streaming handler — same shape as Sales OS so the API can swap
    handlers by os_name without caring about per-OS internals."""
    async for event in orchestrator.handle(brief, ctx):
        yield event
