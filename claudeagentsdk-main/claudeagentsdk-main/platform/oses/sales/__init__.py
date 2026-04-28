"""Sales OS entrypoint — registers with the platform registry."""
from __future__ import annotations

from typing import Any

from oses._protocol import OS, OSResult, ResourceSpec, SubagentSpec, TenantCtx
from oses.sales import orchestrator
from oses.sales.agents import agent_specs
from oses.sales.config import SalesConfig


NAME = "sales"
DISPLAY_NAME = "Sales OS"   # default; per-tenant override via os_configs.display_name
VERSION = "0.1.0"


# Suggestion chips shown in the onboarding wizard's "Name your AI operator" step.
NAME_SUGGESTIONS = ["Samira", "Nova", "Atlas", "Rue", "Kai"]


RESOURCES: list[ResourceSpec] = [
    ResourceSpec(key="apollo_credits", display_name="Apollo credits",
                 unit="credits", default_period="month"),
    ResourceSpec(key="gmail_sends",    display_name="Gmail sends",
                 unit="emails",  default_period="day"),
    ResourceSpec(key="twilio_sms",     display_name="Twilio SMS",
                 unit="sends",   default_period="day"),
    ResourceSpec(key="voice_minutes",  display_name="Voice minutes",
                 unit="minutes", default_period="month"),
]


class _SalesOS:
    name = NAME
    display_name = DISPLAY_NAME
    version = VERSION
    config_schema = SalesConfig
    name_suggestions = NAME_SUGGESTIONS
    resources = RESOURCES

    def bootstrap(self, ctx: TenantCtx) -> None:
        # Phase 0: no-op. Phase 1 will: ensure budgets, ensure goals, check config
        # exists, raise ConfigMissing if not — triggering the onboarding wizard.
        pass

    def handle(self, brief: str, ctx: TenantCtx) -> OSResult:
        # Sync facade over the async orchestrator. The CLI calls handle_async()
        # directly for streaming; this method is for simpler callers.
        raise NotImplementedError(
            "Use oses.sales.handle_async() for streaming. A sync facade lands in Phase 1."
        )

    def health(self, ctx: TenantCtx) -> dict[str, Any]:
        return {"status": "ok", "version": VERSION, "subagents": [s.name for s in agent_specs()]}

    def subagents(self) -> list[SubagentSpec]:
        return agent_specs()


OS_INSTANCE: OS = _SalesOS()


async def handle_async(brief: str, ctx: TenantCtx):
    """Async streaming version. The CLI and web UI both use this."""
    async for event in orchestrator.handle(brief, ctx):
        yield event
