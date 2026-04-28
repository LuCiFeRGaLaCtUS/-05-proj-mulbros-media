"""TEMPLATE_OS entrypoint — registers with the platform registry.

Copy this folder to oses/<your-os>/ and replace TEMPLATE_OS / template_os
placeholders. See /platform/oses/_template/CLAUDE.md for instructions.
"""
from __future__ import annotations

from typing import Any

from oses._protocol import OS, OSResult, ResourceSpec, SubagentSpec, TenantCtx
from oses.template_os import orchestrator
from oses.template_os.agents import agent_specs
from oses.template_os.config import TemplateOsConfig


NAME = "template_os"
DISPLAY_NAME = "Template OS"
VERSION = "0.1.0"


# Suggestion chips for the onboarding wizard's "Name your AI operator" step.
# Pick names that fit the OS's domain.
NAME_SUGGESTIONS = ["Aurora", "Forge", "Beacon", "Nimbus", "Sentinel"]


# Declare every external resource this OS consumes (used by the budget ledger).
# Examples below — replace with what your OS actually consumes.
RESOURCES: list[ResourceSpec] = [
    # ResourceSpec(key="api_credits", display_name="API credits",
    #              unit="credits", default_period="month"),
]


class _TemplateOS:
    name = NAME
    display_name = DISPLAY_NAME
    version = VERSION
    config_schema = TemplateOsConfig
    name_suggestions = NAME_SUGGESTIONS
    resources = RESOURCES

    def bootstrap(self, ctx: TenantCtx) -> None:
        # Idempotent setup: ensure budgets, ensure goals, raise ConfigMissing
        # if the tenant hasn't run the wizard yet.
        pass

    def handle(self, brief: str, ctx: TenantCtx) -> OSResult:
        # Sync facade. Use handle_async() for streaming.
        raise NotImplementedError("Use oses.template_os.handle_async() for streaming.")

    def health(self, ctx: TenantCtx) -> dict[str, Any]:
        return {"status": "ok", "version": VERSION,
                "subagents": [s.name for s in agent_specs()]}

    def subagents(self) -> list[SubagentSpec]:
        return agent_specs()


OS_INSTANCE: OS = _TemplateOS()


async def handle_async(brief: str, ctx: TenantCtx):
    """Async streaming handler — same shape as Sales OS so the API can swap
    handlers by os_name without caring about per-OS internals."""
    async for event in orchestrator.handle(brief, ctx):
        yield event
