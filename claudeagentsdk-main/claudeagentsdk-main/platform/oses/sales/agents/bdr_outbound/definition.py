"""BDR outbound subagent definition."""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "bdr_outbound"
DISPLAY_NAME = "BDR (Outbound)"
PROMPT_VERSION = "3"
MODEL = "sonnet"
SKILLS_USED = [
    "personalization-research",
    "cold-email-first-touch",
    "cold-email-follow-up",
    "sms-outreach",
    "voice-call-opener",
    "compliance-anti-spam",
    "privacy-pii-handling",
    "tone-professional-warm",
]
TOOLS = [
    "mcp__composio__*",
    "mcp__sales_internal__list_leads",
    "mcp__sales_internal__update_lead",
    "mcp__sales_internal__remember",
    "mcp__sales_internal__recall",
    "mcp__sales_outbound__send_email",
    "mcp__sales_outbound__send_sms",
    "mcp__sales_outbound__place_call",
    "mcp__sales_internal__request_approval",
]


def _load_prompt() -> str:
    p = Path(__file__).parent / "prompts" / f"v{PROMPT_VERSION}.md"
    text = p.read_text()
    if text.startswith("---"):
        _, _fm, body = text.split("---", 2)
        text = body.strip()
    return text


def build() -> tuple[AgentDefinition, SubagentSpec]:
    prompt = skills.inject(_load_prompt(), SKILLS_USED)
    definition = AgentDefinition(
        description=(
            "Use when scored leads need outreach. Picks best channel "
            "(email/SMS/voice) from enriched data + tenant outreach rules. "
            "Sandbox-aware: in sandbox mode all outbound is redirected."
        ),
        prompt=prompt,
        model=MODEL,
    )
    from oses.sales.agents.bdr_outbound.triggers import SPEC as trig
    spec = SubagentSpec(
        name=NAME,
        display_name=DISPLAY_NAME,
        triggers=trig,
        prompt_version=PROMPT_VERSION,
        tools=TOOLS,
        skills=SKILLS_USED,
        model=MODEL,
    )
    return definition, spec
