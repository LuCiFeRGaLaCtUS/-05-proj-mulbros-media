"""Briefer subagent definition.

The single specialist of Brief OS. Assembles a markdown digest from cross-OS
state and (optionally) Gmail-sends it. No Apollo, LiveKit, Twilio, etc. — the
allowlist is tight on purpose so the demo proves per-OS scope narrowing.
"""
from __future__ import annotations

from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec
from skills import _loader as skills


NAME = "briefer"
DISPLAY_NAME = "Briefer"
PROMPT_VERSION = "1"
MODEL = "haiku"
SKILLS_USED = ["briefing-template", "friendly-summary", "privacy-pii-handling"]
TOOLS = [
    "mcp__brief_internal__get_brief_context",
    "mcp__brief_internal__save_brief",
    # Reuses the existing Composio meta-tool — sandbox-aware, governance-wrapped.
    # Only invoked when the tenant configured a delivery_email.
    "mcp__composio__COMPOSIO_MULTI_EXECUTE_TOOL",
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
            "Use when the user asks for a brief, daily update, summary, or "
            "what's happening across the platform. Reads cross-OS state and "
            "produces a personalized markdown digest."
        ),
        prompt=prompt,
        model=MODEL,
    )
    from oses.brief.agents.briefer.triggers import SPEC as trig
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
