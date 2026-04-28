"""Template OS orchestrator — Claude Agent SDK driver.

Pattern (mirror oses/sales/orchestrator.py):
1. Build the orchestrator AgentDefinition with tool allowlist + system prompt.
2. Build subagent definitions via agent_specs() + per-subagent build().
3. Stream events from ClaudeSDKClient(...).query(brief).
4. Persist messages, lead/job updates, and audit rows along the way.

Keep this file thin. The orchestrator routes; specialists do the work.
"""
from __future__ import annotations

from typing import AsyncIterator

from oses._protocol import TenantCtx


async def handle(brief: str, ctx: TenantCtx) -> AsyncIterator[dict]:
    """Stream events from the Template OS orchestrator.

    Replace this stub with the real Claude Agent SDK loop. See
    oses/sales/orchestrator.py for the canonical implementation.
    """
    yield {"type": "stub", "message": "Template OS orchestrator not yet implemented."}
    raise NotImplementedError(
        "Replace this stub with the Claude Agent SDK driver. "
        "Mirror oses/sales/orchestrator.py."
    )
