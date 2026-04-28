"""Lead enricher subagent definition."""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "lead_enricher"
DISPLAY_NAME = "Lead Enricher"
PROMPT_VERSION = "1"
MODEL = "sonnet"
SKILLS_USED = ["email-pattern-inference", "firmographic-research", "technographic-lookup"]
TOOLS = [
    "mcp__composio__*",
    "mcp__sales_internal__list_leads",
    "mcp__sales_internal__update_lead",
    "mcp__sales_internal__remember",
    "mcp__sales_internal__recall",
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
            "Use when leads with missing firmographic or contact data need filling in. "
            "Typically reads status='new' leads and writes back enriched data with "
            "status='enriched'."
        ),
        prompt=prompt,
        model=MODEL,
    )
    from oses.sales.agents.lead_enricher.triggers import SPEC as trig
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
