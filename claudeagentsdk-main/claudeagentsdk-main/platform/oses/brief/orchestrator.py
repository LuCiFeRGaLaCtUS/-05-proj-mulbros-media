"""Brief OS orchestrator — minimal single-subagent dispatcher.

Sales OS uses a Haiku pre-classifier to pick which subagent(s) to run.
Brief OS has exactly one specialist (`briefer`), so classification is
unnecessary — every brief routes to the briefer. The orchestrator's job is
purely (1) wire identity/governance/tracing, (2) run the SDK loop, (3) stream
events back through the chat plumbing.

Mirrors `oses.sales.orchestrator.handle` shape so apps/api/server.py can swap
handlers by os_name without per-OS branches in the streaming code.
"""
from __future__ import annotations

import os
from typing import AsyncIterator

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolUseBlock,
)

from governance.middleware import GovContext, set_context
from governance.sandbox import SandboxConfig
from oses._protocol import TenantCtx
from oses.brief.agents import agent_definitions
from oses.brief.internal_tools import internal_mcp
from shared import logging as plog

log = plog.get("brief.orchestrator")


ORCHESTRATOR_PROMPT_TEMPLATE = """You run **{display_name}** — a briefing OS that produces personalized digests for the tenant.

You have exactly one specialist: the briefer. Always route the user's request to it.

## How to handle every brief
1. Greet briefly in one short sentence ("Pulling today's data…").
2. Invoke the briefer subagent with the user's request.
3. Stream the briefer's reply.

## Identity and tone
You speak as **{display_name}**. Don't mention "subagents" or "tools" by their technical names. Plain language only.

## Sandbox awareness
{sandbox_note}
"""


def _sandbox_note(sandbox: SandboxConfig) -> str:
    if not sandbox.enabled:
        return "Sandbox mode is OFF. Outbound goes to real recipients."
    parts = ["**SANDBOX MODE IS ON.** Outbound is redirected:"]
    if sandbox.redirect_email:
        parts.append(f"- Email → {sandbox.redirect_email}")
    parts.append("Proceed normally; the middleware handles redirection.")
    return "\n".join(parts)


def _build_options(ctx: TenantCtx, display_name: str) -> ClaudeAgentOptions:
    sandbox = SandboxConfig.from_tenant(ctx.sandbox)
    composio_url = os.environ.get("COMPOSIO_MCP_URL")
    composio_headers: dict[str, str] = {}
    if key := os.environ.get("COMPOSIO_API_KEY"):
        composio_headers["x-consumer-api-key"] = key

    mcp_servers: dict[str, dict] = {"brief_internal": internal_mcp}
    if composio_url:
        mcp_servers["composio"] = {
            "type": "http",
            "url": composio_url,
            "headers": composio_headers,
        }

    prompt = ORCHESTRATOR_PROMPT_TEMPLATE.format(
        display_name=display_name,
        sandbox_note=_sandbox_note(sandbox),
    )

    return ClaudeAgentOptions(
        system_prompt=prompt,
        mcp_servers=mcp_servers,
        agents=agent_definitions(),
        allowed_tools=[
            "Agent",
            "mcp__brief_internal__*",
            "mcp__composio__*",      # only used when delivery_email is set
        ],
        permission_mode="acceptEdits",
        max_turns=10,                # one briefing rarely needs more
    )


async def handle(brief: str, ctx: TenantCtx) -> AsyncIterator[dict]:
    """Run one brief through Brief OS. Yields the same event shape Sales OS
    yields, so the API SSE stream and the chat renderer don't need branches."""
    from chat.translations import humanize
    from shared.auth import stytch as agent_auth
    from shared.db import chat as chat_db
    from shared.obs import langfuse_tracer
    from shared.versions import active_config, active_manifest

    run_id = ctx.run_id or "unknown"
    cfg = active_config(ctx.tenant_id, "brief") or {}
    display_name = (cfg.get("identity") or {}).get("display_name") or "Brief OS"

    manifest = active_manifest(ctx.tenant_id, "brief")
    agent_token, agent_claims = agent_auth.mint_agent_token(
        tenant_id=ctx.tenant_id,
        os_name="brief",
        agent_name="brief_orchestrator",
        scopes=["tool:*"],
        run_id=run_id,
        ttl_seconds=1800,
    )
    set_context(GovContext(
        tenant_id=ctx.tenant_id,
        run_id=run_id,
        os_name="brief",
        agent_name="brief_orchestrator",
        sandbox=SandboxConfig.from_tenant(ctx.sandbox),
        token=agent_token,
        token_id=agent_claims.token_id,
        scopes=list(agent_claims.scopes),
        version_manifest=manifest.as_json(),
    ))

    session_id = ctx.session_id
    if session_id:
        chat_db.append_message(
            session_id=session_id, tenant_id=ctx.tenant_id,
            role="user", content=brief,
        )
        chat_db.rename_session_if_default(session_id, brief)

    trace = langfuse_tracer.start_run(
        tenant_id=ctx.tenant_id,
        os_name="brief",
        brief=brief,
        run_id=run_id,
        version_manifest=manifest.as_json(),
    )
    final_turns: int | None = None
    final_cost: float | None = None
    collected_text: list[str] = []
    error: str | None = None

    options = _build_options(ctx, display_name)
    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(brief)
            async for msg in client.receive_response():
                if isinstance(msg, SystemMessage) and msg.subtype == "init":
                    yield {"kind": "system.init", "data": msg.data}
                elif isinstance(msg, AssistantMessage):
                    for block in msg.content:
                        if isinstance(block, TextBlock):
                            collected_text.append(block.text)
                            if session_id:
                                chat_db.append_message(
                                    session_id=session_id, tenant_id=ctx.tenant_id,
                                    role="assistant", content=block.text,
                                )
                            yield {"kind": "text", "text": block.text}
                        elif isinstance(block, ToolUseBlock):
                            block_input = getattr(block, "input", None)
                            label = humanize(block.name, block_input)
                            inner_slug = None
                            if isinstance(block_input, dict):
                                tools_list = block_input.get("tools") or []
                                if tools_list and isinstance(tools_list[0], dict):
                                    inner_slug = tools_list[0].get("tool_slug")
                            if session_id:
                                chat_db.append_message(
                                    session_id=session_id, tenant_id=ctx.tenant_id,
                                    role="tool", content=label,
                                    attachments=[{"kind": "tool-trace",
                                                  "tool_name": block.name,
                                                  "inner_slug": inner_slug,
                                                  "human_label": label}],
                                )
                            yield {"kind": "tool_use", "name": block.name,
                                   "inner_slug": inner_slug}
                elif isinstance(msg, ResultMessage):
                    final_turns = msg.num_turns
                    final_cost = msg.total_cost_usd or 0
                    if session_id:
                        chat_db.append_message(
                            session_id=session_id, tenant_id=ctx.tenant_id,
                            role="system",
                            content=f"done in {final_turns} turns · ${final_cost:.4f}",
                            attachments=[{"kind": "result",
                                          "turns": final_turns,
                                          "cost_usd": final_cost}],
                        )
                        chat_db.touch_session(session_id)
                    yield {"kind": "result", "turns": final_turns, "cost_usd": final_cost}
    except Exception as e:
        error = str(e)
        raise
    finally:
        langfuse_tracer.end_run(
            trace,
            summary="\n".join(collected_text)[-2000:],
            cost_usd=final_cost,
            turns=final_turns,
            error=error,
        )
        langfuse_tracer.flush()
