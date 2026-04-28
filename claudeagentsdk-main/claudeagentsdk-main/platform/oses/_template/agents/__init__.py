"""Auto-discover subagent specs for Template OS.

Pattern (mirror oses/sales/agents/__init__.py): walk the agents/ directory,
import each subagent's definition.build(), and return a list of SubagentSpec.
The orchestrator and platform registry consume this list.
"""
from __future__ import annotations

from oses._protocol import SubagentSpec


def agent_specs() -> list[SubagentSpec]:
    """Return all subagent specs discovered in this OS's agents/ folder."""
    # Replace with real auto-discovery; mirror oses/sales/agents/__init__.py.
    from oses.template_os.agents.example_subagent.definition import build as build_example
    _def, spec = build_example()
    return [spec]
