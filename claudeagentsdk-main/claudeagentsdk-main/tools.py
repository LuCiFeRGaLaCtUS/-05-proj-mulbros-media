import asyncio
import json
from typing import Any

from claude_agent_sdk import create_sdk_mcp_server, tool

from db import get_supabase
from memory_store import MEM0_USER, get_mem0


def _text(payload: Any) -> dict:
    body = payload if isinstance(payload, str) else json.dumps(payload, default=str)
    return {"content": [{"type": "text", "text": body}]}


@tool(
    "save_lead",
    "Insert a newly sourced lead. Returns the generated lead_id.",
    {
        "name": str,
        "email": str,
        "company": str,
        "title": str,
        "linkedin_url": str,
        "source": str,
    },
)
async def save_lead(args: dict) -> dict:
    def _insert():
        return (
            get_supabase()
            .table("leads")
            .insert(
                {
                    "name": args.get("name"),
                    "email": args.get("email"),
                    "company": args.get("company"),
                    "title": args.get("title"),
                    "linkedin_url": args.get("linkedin_url"),
                    "source": args.get("source") or "sourcer",
                    "status": "new",
                }
            )
            .execute()
        )

    resp = await asyncio.to_thread(_insert)
    lead_id = resp.data[0]["id"] if resp.data else None
    return _text({"lead_id": lead_id})


@tool(
    "update_lead",
    "Update a lead with enrichment fields and/or a new status. `fields` is a JSON object of columns to set (e.g. email, phone, company_domain, company_size, company_revenue, industry, location, tech_stack, enrichment, status, score, score_rationale).",
    {"lead_id": str, "fields": dict},
)
async def update_lead(args: dict) -> dict:
    def _update():
        return (
            get_supabase()
            .table("leads")
            .update(args["fields"])
            .eq("id", args["lead_id"])
            .execute()
        )

    resp = await asyncio.to_thread(_update)
    return _text({"updated": len(resp.data or [])})


@tool(
    "list_leads",
    "Return leads as JSON. Filter by status ('new'|'enriched'|'scored'|'' for all) and cap with limit.",
    {"status": str, "limit": int},
)
async def list_leads(args: dict) -> dict:
    def _query():
        q = get_supabase().table("leads").select("*")
        if args.get("status"):
            q = q.eq("status", args["status"])
        return q.limit(args.get("limit") or 50).execute()

    resp = await asyncio.to_thread(_query)
    return _text(resp.data or [])


@tool(
    "remember",
    "Persist a durable fact, preference, or learning in mem0 for reuse in future runs.",
    {"content": str, "category": str},
)
async def remember(args: dict) -> dict:
    def _add():
        return get_mem0().add(
            messages=[{"role": "user", "content": args["content"]}],
            user_id=MEM0_USER,
            metadata={"category": args.get("category") or "general"},
        )

    await asyncio.to_thread(_add)
    return _text("saved")


@tool(
    "recall",
    "Search mem0 for relevant memories about the ICP, prior leads, sources, or scoring rubric.",
    {"query": str, "limit": int},
)
async def recall(args: dict) -> dict:
    def _search():
        return get_mem0().search(
            query=args["query"],
            filters={"user_id": MEM0_USER},
            limit=args.get("limit") or 5,
        )

    results = await asyncio.to_thread(_search)
    items = results.get("results", results) if isinstance(results, dict) else results
    if not items:
        return _text("(no memories)")
    lines = [f"- {r.get('memory', r) if isinstance(r, dict) else r}" for r in items]
    return _text("\n".join(lines))


internal_mcp = create_sdk_mcp_server(
    name="internal",
    version="1.0.0",
    tools=[save_lead, update_lead, list_leads, remember, recall],
)
