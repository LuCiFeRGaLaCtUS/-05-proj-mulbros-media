"""Subagent auto-discovery.

At OS bootstrap, `discover()` walks this directory and imports each subagent
module. Each subagent exposes `build()` returning `(AgentDefinition, SubagentSpec)`.
Adding a new subagent = drop a folder here with definition.py + triggers.py
+ prompts/. No central list to update.
"""
from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec


_AGENTS_DIR = Path(__file__).parent


def discover() -> dict[str, tuple[AgentDefinition, SubagentSpec]]:
    """Return {agent_name: (AgentDefinition, SubagentSpec)} for every subagent
    module under oses/sales/agents/<name>/."""
    out: dict[str, tuple[AgentDefinition, SubagentSpec]] = {}
    for mod_info in pkgutil.iter_modules([str(_AGENTS_DIR)]):
        if not mod_info.ispkg:
            continue
        if mod_info.name.startswith("_"):
            continue
        try:
            defn_module = importlib.import_module(
                f"oses.sales.agents.{mod_info.name}.definition"
            )
        except ModuleNotFoundError:
            continue
        if not hasattr(defn_module, "build"):
            continue
        definition, spec = defn_module.build()
        out[spec.name] = (definition, spec)
    return out


def agent_definitions() -> dict[str, AgentDefinition]:
    """Shortcut for claude-agent-sdk's `agents=` kwarg."""
    return {name: pair[0] for name, pair in discover().items()}


def agent_specs() -> list[SubagentSpec]:
    """Used by the pre-classifier to build its routing table."""
    return [pair[1] for pair in discover().values()]
