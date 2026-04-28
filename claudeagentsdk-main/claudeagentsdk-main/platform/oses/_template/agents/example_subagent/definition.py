"""Example subagent definition — replace with a real specialist.

This is the canonical shape every subagent in every OS follows. Copy it as a
starting point. See /platform/oses/CLAUDE.md for the decision tree on what
becomes a skill vs. a tool vs. a connector vs. a new subagent.
"""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "example_subagent"
DISPLAY_NAME = "Example Subagent"
PROMPT_VERSION = "1"
MODEL = "sonnet"   # haiku for cheap classifiers, opus for high-stakes reasoning

# Skills must exist in /platform/skills/ with applies_to=[example_subagent]
SKILLS_USED: list[str] = [
    # "skill-one",
    # "skill-two",
]

# Principle of least authority: include ONLY tools this subagent legitimately needs.
TOOLS: list[str] = [
    "mcp__composio__*",
    "mcp__template_os_internal__list_things",
    "mcp__template_os_internal__remember",
    "mcp__template_os_internal__recall",
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
            "One-line description of when the orchestrator should route to this subagent."
        ),
        prompt=prompt,
        model=MODEL,
    )
    from oses.template_os.agents.example_subagent.triggers import SPEC as trig
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
