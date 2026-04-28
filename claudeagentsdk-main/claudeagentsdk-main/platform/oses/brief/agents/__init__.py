"""Subagent auto-discovery for Brief OS.

Identical pattern to oses/sales/agents/__init__.py — drop a subagent folder
under here with `definition.py` exposing `build()`, and the OS picks it up.
"""
from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path

from claude_agent_sdk import AgentDefinition

from oses._protocol import SubagentSpec


_AGENTS_DIR = Path(__file__).parent


def discover() -> dict[str, tuple[AgentDefinition, SubagentSpec]]:
    out: dict[str, tuple[AgentDefinition, SubagentSpec]] = {}
    for mod_info in pkgutil.iter_modules([str(_AGENTS_DIR)]):
        if not mod_info.ispkg or mod_info.name.startswith("_"):
            continue
        try:
            defn_module = importlib.import_module(
                f"oses.brief.agents.{mod_info.name}.definition"
            )
        except ModuleNotFoundError:
            continue
        if not hasattr(defn_module, "build"):
            continue
        definition, spec = defn_module.build()
        out[spec.name] = (definition, spec)
    return out


def agent_definitions() -> dict[str, AgentDefinition]:
    return {name: pair[0] for name, pair in discover().items()}


def agent_specs() -> list[SubagentSpec]:
    return [pair[1] for pair in discover().values()]
