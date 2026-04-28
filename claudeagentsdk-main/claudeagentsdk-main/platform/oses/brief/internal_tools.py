"""Brief OS internal MCP tools.

Exposes two governed tools for the briefer subagent:
  - get_brief_context: returns config + cross-OS data in one call
  - save_brief:        persists the produced brief + emits brief.generated

Both tools run through the @governed middleware so audit + identity checks
are automatic. All Supabase reads/writes are tenant-scoped via current().tenant_id.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from governance.middleware import current, governed
from oses.brief import cross_os_reader
from shared import events as event_bus, logging as plog
from shared.db.supabase import client as sb_client
from shared.versions import active_config


log = plog.get("brief.internal_tools")


def _text(payload: Any) -> dict:
    body = payload if isinstance(payload, str) else json.dumps(payload, default=str)
    return {"content": [{"type": "text", "text": body}]}


# ---------------------------------------------------------------------------
# get_brief_context — config + cross-OS state in one call
# ---------------------------------------------------------------------------
@tool(
    "get_brief_context",
    "Return the tenant's Brief OS config plus all cross-OS state the briefer "
    "might cite. Always call this first. Returns "
    "{recipient_name, sections, tone, delivery_email, data:{pipeline_summary, "
    "recent_opportunities, budget_status, outreach_recent}}.",
    {},
)
@governed()
async def get_brief_context(args: dict) -> dict:
    ctx = current()
    cfg = active_config(ctx.tenant_id, "brief") or {}
    payload = {
        "recipient_name": cfg.get("recipient_name") or "",
        "sections": cfg.get("sections") or
                    ["pipeline", "opportunities", "budgets", "outreach"],
        "tone": cfg.get("tone") or "concise",
        "delivery_email": cfg.get("delivery_email"),
        "data": await asyncio.to_thread(cross_os_reader.gather, ctx.tenant_id),
    }
    return _text(payload)


# ---------------------------------------------------------------------------
# save_brief — persist + emit
# ---------------------------------------------------------------------------
@tool(
    "save_brief",
    "Persist a generated brief in the briefs table and emit a brief.generated "
    "event. `sections` is the list the agent actually rendered. `emailed_to` "
    "is the address the brief was Gmail-sent to (or null if chat-only).",
    {"sections": list, "content_md": str, "emailed_to": str},
)
@governed()
async def save_brief(args: dict) -> dict:
    ctx = current()
    sections = args.get("sections") or []
    content_md = args.get("content_md") or ""
    emailed_to = args.get("emailed_to") or None

    def _insert():
        return (
            sb_client()
            .table("briefs")
            .insert({
                "tenant_id":  ctx.tenant_id,
                "sections":   sections,
                "content_md": content_md,
                "emailed_to": emailed_to,
            })
            .execute()
        )
    resp = await asyncio.to_thread(_insert)
    brief_id = resp.data[0]["id"] if resp.data else None
    if brief_id:
        event_bus.emit(
            tenant_id=ctx.tenant_id,
            os_name="brief",
            event_type="brief.generated",
            payload={"brief_id": brief_id,
                     "sections": sections,
                     "emailed": bool(emailed_to)},
            agent_name=ctx.agent_name,
        )
    return _text({"brief_id": brief_id})


internal_mcp = create_sdk_mcp_server(
    name="brief_internal",
    version="1.0.0",
    tools=[get_brief_context, save_brief],
)
