"""Lead sourcer subagent definition."""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "lead_sourcer"
DISPLAY_NAME = "Lead Sourcer"
PROMPT_VERSION = "2"
MODEL = "sonnet"
SKILLS_USED = ["icp-parsing", "apollo-search-query-builder", "prospect-deduplication"]
TOOLS = [
    "mcp__composio__*",
    "mcp__sales_internal__save_lead",
    "mcp__sales_internal__remember",
    "mcp__sales_internal__recall",
]


def _load_prompt() -> str:
    prompt_path = Path(__file__).parent / "prompts" / f"v{PROMPT_VERSION}.md"
    text = prompt_path.read_text()
    # Strip frontmatter from the prompt body — it's metadata for tooling, not the LLM.
    if text.startswith("---"):
        _, _fm, body = text.split("---", 2)
        text = body.strip()
    return text


def build() -> tuple[AgentDefinition, SubagentSpec]:
    prompt = skills.inject(_load_prompt(), SKILLS_USED)
    # NOTE: we intentionally do NOT pass `tools=TOOLS` here. The SDK doesn't
    # glob-expand MCP patterns in subagent scope, so `"mcp__composio__*"`
    # would match zero real tools. Instead the subagent inherits the
    # orchestrator's allowed_tools (which does support globs). The TOOLS
    # list remains in SubagentSpec for discovery/documentation.
    definition = AgentDefinition(
        description=(
            "Use when the brief asks for NEW prospects to be discovered. "
            "Searches Composio toolkits (Apollo, LinkedIn, etc.) and writes "
            "candidates to Supabase with status='new'."
        ),
        prompt=prompt,
        model=MODEL,
    )
    from oses.sales.agents.lead_sourcer.triggers import SPEC as trig
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
