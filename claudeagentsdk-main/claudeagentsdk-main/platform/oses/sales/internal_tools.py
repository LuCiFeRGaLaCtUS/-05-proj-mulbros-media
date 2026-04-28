"""Sales OS internal MCP tools — Supabase CRUD + mem0 I/O, tenant-scoped
and governed. Migrated from the original lead-agents-team/tools.py.

Every tool is wrapped with @governed so audit is automatic and sandbox
redirect happens at the tool boundary (for outbound tools — see bdr_outbound).
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from governance import pii
from governance.middleware import current, governed
from shared import events as event_bus, logging as plog
from shared.db.supabase import client as sb_client, table
from shared.memory import mem0

log = plog.get("sales.internal_tools")


def _text(payload: Any) -> dict:
    body = payload if isinstance(payload, str) else json.dumps(payload, default=str)
    return {"content": [{"type": "text", "text": body}]}


# ---------------------------------------------------------------------------
# Leads CRUD
# ---------------------------------------------------------------------------
@tool(
    "save_lead",
    "Insert a newly sourced lead. Returns the generated lead_id.",
    {
        "name": str, "email": str, "company": str, "title": str,
        "linkedin_url": str, "source": str,
    },
)
@governed()
async def save_lead(args: dict) -> dict:
    ctx = current()
    def _insert():
        return (
            sb_client()
            .table("leads")
            .insert({
                "tenant_id": ctx.tenant_id,
                "name": args.get("name"),
                "email": args.get("email"),
                "company": args.get("company"),
                "title": args.get("title"),
                "linkedin_url": args.get("linkedin_url"),
                "source": args.get("source") or "sourcer",
                "status": "new",
            })
            .execute()
        )
    resp = await asyncio.to_thread(_insert)
    lead_id = resp.data[0]["id"] if resp.data else None
    if lead_id:
        event_bus.emit(
            tenant_id=ctx.tenant_id,
            os_name="sales",
            event_type="lead.sourced",
            payload={"lead_id": lead_id, "source": args.get("source")},
            agent_name=ctx.agent_name,
        )
    return _text({"lead_id": lead_id})


@tool(
    "update_lead",
    "Update a lead with enrichment fields and/or a new status. `fields` is a JSON object of columns (email, phone, company_domain, company_size, company_revenue, industry, location, tech_stack, enrichment, status, score, score_rationale).",
    {"lead_id": str, "fields": dict},
)
@governed()
async def update_lead(args: dict) -> dict:
    ctx = current()
    fields = args.get("fields") or {}
    def _update():
        return (
            sb_client()
            .table("leads")
            .update(fields)
            .eq("id", args["lead_id"])
            .eq("tenant_id", ctx.tenant_id)
            .execute()
        )
    resp = await asyncio.to_thread(_update)
    updated = len(resp.data or [])
    # Fire a status-transition event so the meta-OS scanner can reason over it.
    # We only emit for the transitions the scanner cares about — saves noise.
    new_status = fields.get("status")
    if updated and new_status in ("enriched", "scored", "contacted", "replied",
                                   "disqualified", "meeting_booked"):
        event_bus.emit(
            tenant_id=ctx.tenant_id,
            os_name="sales",
            event_type=f"lead.{new_status}",
            payload={
                "lead_id": args["lead_id"],
                "score":   fields.get("score"),
            },
            agent_name=ctx.agent_name,
        )
    return _text({"updated": updated})


@tool(
    "list_leads",
    "Return leads as JSON for the current tenant. Filter by status ('new'|'enriched'|'scored'|'contacted'|'') and cap with limit.",
    {"status": str, "limit": int},
)
@governed()
async def list_leads(args: dict) -> dict:
    ctx = current()
    def _query():
        q = sb_client().table("leads").select("*").eq("tenant_id", ctx.tenant_id)
        if args.get("status"):
            q = q.eq("status", args["status"])
        return q.limit(args.get("limit") or 50).execute()
    resp = await asyncio.to_thread(_query)
    return _text(resp.data or [])


# ---------------------------------------------------------------------------
# mem0 — remember / recall, namespaced by tenant+scope
# ---------------------------------------------------------------------------
@tool(
    "remember",
    "Persist a durable fact, preference, or learning in memory for reuse in future runs. `scope` defaults to the current OS. Raw emails/phones are automatically redacted — memories should capture patterns, not individuals.",
    {"content": str, "category": str, "scope": str},
)
@governed()
async def remember(args: dict) -> dict:
    ctx = current()
    scope = args.get("scope") or f"os:{ctx.os_name or 'sales'}"
    # Defense-in-depth PII redaction before mem0 write. The privacy-pii-handling
    # skill also tells the agent not to write raw PII — this is the safety net.
    clean = pii.redact(args["content"])
    def _add():
        mem0.remember(ctx.tenant_id, scope, clean, category=args.get("category") or "general")
    await asyncio.to_thread(_add)
    return _text("saved")


@tool(
    "recall",
    "Search memory for relevant prior learnings. Returns matching lines. `scope` defaults to the current OS.",
    {"query": str, "limit": int, "scope": str},
)
@governed()
async def recall(args: dict) -> dict:
    ctx = current()
    scope = args.get("scope") or f"os:{ctx.os_name or 'sales'}"
    def _search():
        return mem0.recall(ctx.tenant_id, scope, args["query"], limit=args.get("limit") or 5)
    lines = await asyncio.to_thread(_search)
    if not lines:
        return _text("(no memories)")
    # Redact on read too — safety net against any legacy or cross-tenant leak.
    cleaned = [pii.redact(line) for line in lines]
    return _text("\n".join(f"- {line}" for line in cleaned))


@tool(
    "pick_channel",
    "Decide the best outreach channel for a lead (voice / email / sms) based on "
    "what contact data the lead has, the tenant's outreach rules, budget state, "
    "and compliance guardrails. Call this BEFORE drafting outreach copy. Returns "
    "{channel, reason, skip}. If skip=true, move on without sending.",
    {"lead_id": str},
)
@governed()
async def pick_channel(args: dict) -> dict:
    from oses.sales.channel_picker import pick as _pick
    from shared.versions import active_config
    ctx = current()
    # Fetch the lead
    def _fetch_lead():
        res = (
            sb_client().table("leads").select("*")
            .eq("tenant_id", ctx.tenant_id).eq("id", args["lead_id"])
            .limit(1).execute()
        )
        return (res.data or [None])[0]
    lead = await asyncio.to_thread(_fetch_lead)

    # Pull outreach config from the active os_config_versions row
    cfg = active_config(ctx.tenant_id, ctx.os_name or "sales") or {}
    outreach_cfg = cfg.get("outreach") or {}

    result = _pick(
        tenant_id=ctx.tenant_id,
        os_name=ctx.os_name or "sales",
        lead=lead,
        outreach_config=outreach_cfg,
    )
    return _text(result.as_json())


internal_mcp = create_sdk_mcp_server(
    name="sales_internal",
    version="1.0.0",
    tools=[save_lead, update_lead, list_leads, remember, recall, pick_channel],
)
