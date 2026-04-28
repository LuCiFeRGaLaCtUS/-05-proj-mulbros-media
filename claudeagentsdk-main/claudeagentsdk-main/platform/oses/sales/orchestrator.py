"""Sales OS orchestrator — dispatches briefs to subagents via Claude Agent SDK.

The orchestrator's prompt tells Claude to **pick only the needed subagents**
based on the brief, rather than always running sourcer → enricher → scorer.
The subagent catalog (with their TriggerSpecs from each agents/<name>/triggers.py)
is injected so routing is data-driven, not hardcoded.
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
from oses.sales.agents import agent_definitions, agent_specs
from oses.sales.internal_tools import internal_mcp
from oses.sales.outbound_tools import outbound_mcp
from shared import logging as plog

log = plog.get("sales.orchestrator")


def _format_agent_catalog() -> str:
    lines: list[str] = []
    for spec in agent_specs():
        lines.append(f"### `{spec.name}` — {spec.display_name}")
        lines.append(spec.triggers.description)
        if spec.triggers.handles:
            lines.append("**Handles:** " + ", ".join(spec.triggers.handles))
        if spec.triggers.does_not_handle:
            lines.append("**Does NOT handle:** " + ", ".join(spec.triggers.does_not_handle))
        if spec.triggers.example_briefs:
            examples = " · ".join(f"*{b}*" for b in spec.triggers.example_briefs)
            lines.append(f"**Examples:** {examples}")
        if spec.triggers.order_hints:
            lines.append(f"**Order hints:** {spec.triggers.order_hints}")
        lines.append("")
    return "\n".join(lines)


ORCHESTRATOR_PROMPT_TEMPLATE = """You run a Sales OS multi-agent team on behalf of a tenant.

## Your subagent catalog

{catalog}

## How to route

1. Read the user's brief.
2. Decide which subagent(s) to invoke, in what order. If the brief is clearly a single-stage request, invoke only that one subagent. Don't always run all of them.
3. Consult `list_leads` first when the brief is state-dependent ("continue", "score my leads", "send outreach to my top 5").
4. Preserve logical order when chaining: sourcer → enricher → scorer → BDR, or SDR for inbound. Pre-classifier ordering hints should guide you.
5. Say one sentence up front about your chosen plan before invoking anything. e.g. *"Running sourcer, then enricher — skipping scorer because the brief only asks for a shortlist."*

## Identity and tone
You speak as **{display_name}** to the tenant. Be direct, warm, and short. Don't mention "subagents" or "tools" by their technical names in user-facing messages — say "finding leads" not "invoking lead_sourcer". The chat UI handles tool traces separately.

## Sandbox awareness
{sandbox_note}

## Budget awareness
Every external call passes through pacing guards. If a tool is blocked with `blocked: true`, don't retry — report what happened and offer the user a choice (upgrade plan, pause, shift focus).

At the end of every handling, present a short summary: what was done, top results, any alerts."""


def _sandbox_note(sandbox: SandboxConfig) -> str:
    if not sandbox.enabled:
        return "Sandbox mode is OFF. Outbound goes to real recipients."
    parts: list[str] = ["**SANDBOX MODE IS ON.** All outbound is redirected:"]
    if sandbox.redirect_email:
        parts.append(f"- Email → {sandbox.redirect_email}")
    if sandbox.redirect_phone:
        parts.append(f"- SMS/Voice → {sandbox.redirect_phone}")
    parts.append("The real target is preserved in metadata. Proceed normally.")
    return "\n".join(parts)


def _build_options(ctx: TenantCtx, display_name: str) -> ClaudeAgentOptions:
    sandbox = SandboxConfig.from_tenant(ctx.sandbox)
    composio_url = os.environ.get("COMPOSIO_MCP_URL")
    composio_headers: dict[str, str] = {}
    if key := os.environ.get("COMPOSIO_API_KEY"):
        composio_headers["x-consumer-api-key"] = key

    mcp_servers: dict[str, dict] = {
        "sales_internal": internal_mcp,
        "sales_outbound": outbound_mcp,
    }
    if composio_url:
        mcp_servers["composio"] = {
            "type": "http",
            "url": composio_url,
            "headers": composio_headers,
        }

    # Pull recent unacked variance alerts + customer-facing opportunity reports
    # so the chat can surface them naturally in this run.
    from governance import variance
    from platform_os import opportunity
    alerts = variance.recent_unacked(ctx.tenant_id, "sales", limit=5)
    alerts_block = variance.format_for_prompt(alerts)

    opps = opportunity.unacked_for_audience(ctx.tenant_id, "customer", limit=5)
    opps_block = ""
    if opps:
        lines = ["", "## Opportunities the meta-OS spotted (mention naturally if relevant)"]
        for o in opps:
            icon = {"warning": "⚠️", "opportunity": "✨", "info": "•"}.get(o.get("severity"), "·")
            head = o.get("headline") or ""
            body = o.get("body") or ""
            lines.append(f"{icon} {head}" + (f" — {body}" if body else ""))
        opps_block = "\n".join(lines)

    # Phase 3: pre-classifier plan — if orchestrator.handle stashed one on the
    # TenantCtx before calling _build_options, inject it as a strong recommendation.
    plan_block = getattr(ctx, "_plan_block", "") or ""

    prompt = ORCHESTRATOR_PROMPT_TEMPLATE.format(
        catalog=_format_agent_catalog(),
        display_name=display_name,
        sandbox_note=_sandbox_note(sandbox),
    ) + plan_block + alerts_block + opps_block

    return ClaudeAgentOptions(
        system_prompt=prompt,
        mcp_servers=mcp_servers,
        agents=agent_definitions(),
        allowed_tools=[
            "Agent",
            "mcp__composio__*",
            "mcp__sales_internal__*",
            "mcp__sales_outbound__*",
        ],
        permission_mode="acceptEdits",
        max_turns=40,
    )


async def handle(brief: str, ctx: TenantCtx) -> AsyncIterator[dict]:
    """Run one brief against the Sales OS. Yields events (text, tool-use, result)
    the CLI/chat renderer can stream to the user in plain language."""
    from governance import pii, variance
    from shared.versions import active_config, active_manifest
    run_id = ctx.run_id or "unknown"

    # Intake-level injection scan. We don't block — false positives on legit
    # briefs are worse than the current attack surface — but we record a
    # variance alert so the operator sees repeated attempts.
    findings = pii.scan_for_injection(brief)
    if findings:
        variance.raise_(
            tenant_id=ctx.tenant_id,
            os_name="sales",
            alert_type="policy_deny",       # reused; Phase 1.5 can add a dedicated kind
            severity="info",
            message="Brief contained patterns that look like prompt-injection attempts — "
                    "noted, not blocked.",
            payload={"findings": findings, "brief_sample": brief[:200]},
        )

    # ── Phase 3 pre-classifier ───────────────────────────────────────────
    # Cheap Haiku call produces a structured routing plan. The orchestrator
    # still has final say, but follows this recommendation in the typical run.
    from platform_os import classifier as classifier_mod
    from shared.db.supabase import table as _table

    # State signal: lead counts per status (helps the classifier know if
    # "score my enriched leads" has anything to score).
    state_counts: dict[str, int] = {}
    try:
        for s in ("new", "enriched", "scored", "contacted", "replied",
                  "meeting_booked", "disqualified"):
            res = (
                _table("leads").select("id", count="exact")
                .eq("tenant_id", ctx.tenant_id).eq("status", s)
                .limit(1).execute()
            )
            if res.count:
                state_counts[f"leads.{s}"] = int(res.count)
    except Exception:
        pass  # state is advisory — classifier still works without it

    catalog = classifier_mod.catalog_from_specs(agent_specs())
    plan = classifier_mod.classify(
        tenant_id=ctx.tenant_id,
        os_name="sales",
        brief=brief,
        subagent_specs=catalog,
        state=state_counts,
    )

    # Human-input short-circuit: if the classifier says the brief is genuinely
    # ambiguous, yield a question and skip the SDK run entirely. Persist the
    # user's brief + clarification to chat_messages so the web UI (which
    # reads from DB, not SSE) renders them.
    if plan.needs_human_input and plan.clarification_question:
        from shared.db import chat as chat_db
        sid = ctx.session_id
        if sid:
            chat_db.append_message(
                session_id=sid, tenant_id=ctx.tenant_id,
                role="user", content=brief,
            )
            chat_db.rename_session_if_default(sid, brief)
            chat_db.append_message(
                session_id=sid, tenant_id=ctx.tenant_id,
                role="assistant", content=plan.clarification_question,
            )
            chat_db.touch_session(sid)
        yield {"kind": "text", "text": plan.clarification_question}
        yield {"kind": "result", "turns": 0, "cost_usd": plan.cost_usd}
        return

    # Prepare a prompt block that nudges the orchestrator toward the plan.
    # Strong recommendation, not enforcement — orchestrator can adapt if the
    # classifier missed something.
    plan_block = "\n\n## Recommended plan (from the pre-classifier)\n"
    plan_block += f"_Reasoning: {plan.reasoning}_\n\n"
    plan_block += plan.recommended_chain()
    plan_block += ("\n\nFollow this order unless you notice a critical reason "
                   "the classifier missed — then explain the deviation.")
    # Stash on ctx so _build_options picks it up (kept out of the dataclass so
    # we don't have to touch the shared TenantCtx shape for one OS).
    setattr(ctx, "_plan_block", plan_block)

    # Tenant's chosen OS display name — override from active config if set.
    cfg = active_config(ctx.tenant_id, "sales") or {}
    identity = cfg.get("identity") or {}
    display_name = identity.get("display_name") or "Sales OS"

    # Snapshot the active version manifest. Every @governed tool call in this
    # run stamps this manifest onto its audit row, so the run is reproducible
    # from the audit log alone.
    manifest = active_manifest(ctx.tenant_id, "sales")

    # Mint a signed agent token for this run — carries identity + scopes the
    # governance middleware verifies on every @governed call. Broad scope
    # (tool:*) for the orchestrator since subagents share its context; per-
    # subagent scope narrowing arrives in Phase 2.
    from shared.auth import stytch as agent_auth
    agent_token, agent_claims = agent_auth.mint_agent_token(
        tenant_id=ctx.tenant_id,
        os_name="sales",
        agent_name="sales_orchestrator",
        scopes=["tool:*"],
        run_id=run_id,
        ttl_seconds=3600,
    )

    # Set the governance context for the whole run. Internal tools read this
    # via governance.middleware.current().
    set_context(GovContext(
        tenant_id=ctx.tenant_id,
        run_id=run_id,
        os_name="sales",
        agent_name="sales_orchestrator",
        sandbox=SandboxConfig.from_tenant(ctx.sandbox),
        token=agent_token,
        token_id=agent_claims.token_id,
        scopes=list(agent_claims.scopes),
        version_manifest=manifest.as_json(),
    ))

    from chat.translations import humanize
    from shared.db import chat as chat_db
    from shared.obs import langfuse_tracer

    # Persist the user's brief when a session_id is set (web UI path).
    session_id = ctx.session_id
    if session_id:
        chat_db.append_message(
            session_id=session_id, tenant_id=ctx.tenant_id,
            role="user", content=brief,
        )
        # If this is the session's first user message, promote the brief to
        # the session title so the sidebar stops showing "New chat" forever.
        chat_db.rename_session_if_default(session_id, brief)

    trace = langfuse_tracer.start_run(
        tenant_id=ctx.tenant_id,
        os_name="sales",
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
                            # Pass tool input so COMPOSIO_MULTI_EXECUTE_TOOL
                            # resolves to its inner action slug for a specific
                            # label ("Sending email via Gmail" not the generic
                            # "Composio multi execute tool").
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
                            yield {"kind": "tool_use", "name": block.name, "inner_slug": inner_slug}
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
                    yield {
                        "kind": "result",
                        "turns": final_turns,
                        "cost_usd": final_cost,
                    }
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
