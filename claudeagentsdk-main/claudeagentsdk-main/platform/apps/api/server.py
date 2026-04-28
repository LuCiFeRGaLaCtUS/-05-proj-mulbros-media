"""FastAPI app — chat backend for the local Phase 2 web UI.

Endpoints:
    GET  /                                     -> index.html (SPA)
    GET  /static/*                             -> static files
    GET  /api/me                               -> {tenant_id, display_name, entitled_oses, branding}
    GET  /api/tenants/{tenant}/os/{os}/sessions -> list sessions
    POST /api/tenants/{tenant}/os/{os}/sessions -> create new session
    GET  /api/sessions/{session_id}/messages   -> list messages in a session
    POST /api/sessions/{session_id}/messages   -> post user message + stream response (SSE)

Dev auth: Phase 2 hardcodes tenant=acme-test. Phase 5 will swap in Stytch B2B
human sessions. For now the tenant slug is the URL param.
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from governance import budget as budget_engine
from oses.brief import handle_async as handle_async_brief
from oses.sales import handle_async as handle_async_sales
from platform_os import opportunity, registry, tenant as tenant_mod


# Per-OS streaming dispatch — keyed by os_name. Adding a new OS = one line.
_OS_HANDLERS = {
    "sales": handle_async_sales,
    "brief": handle_async_brief,
}
from shared import config, logging as plog
from shared.db import chat as chat_db
from shared.db.supabase import client as sb_client, table

log = plog.get("apps.api")


WEB_ROOT = Path(__file__).resolve().parents[1] / "web"


app = FastAPI(title="Platform API (Phase 2 dev)")

from apps.api.webhooks import router as webhooks_router  # noqa: E402
app.include_router(webhooks_router)

# Demo + operator surfaces are dev-only. In APP_ENV=prod they're never mounted,
# so /api/demo/* and /api/operator/* return 404 in production.
if not config.is_prod():
    from apps.api.demo import router as demo_router  # noqa: E402
    app.include_router(demo_router)


# Run sandbox startup checks: hard-fail in prod if any tenant has sandbox
# enabled; print a banner in dev/staging when SANDBOX_EMAIL/SANDBOX_PHONE
# are unset so devs see it before their first send attempt.
from governance import sandbox as _sandbox  # noqa: E402
try:
    _warnings = _sandbox.startup_check_all_tenants()
    _banner = _sandbox.format_startup_banner(_warnings)
    if _banner:
        log.warning("sandbox_startup_banner", extra={"banner": _banner})
        print(_banner, flush=True)
except RuntimeError as _e:
    # Re-raise so uvicorn refuses to boot — production hard-fail.
    raise


# ---------------------------------------------------------------------------
# Static SPA
# ---------------------------------------------------------------------------
if WEB_ROOT.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_ROOT)), name="static")


@app.get("/")
async def index():
    html = WEB_ROOT / "index.html"
    if not html.exists():
        return {"ok": False, "msg": f"apps/web/index.html missing at {html}"}
    return FileResponse(str(html))


# ---------------------------------------------------------------------------
# Tenant context (for UI greeting / entitled OS gate)
# ---------------------------------------------------------------------------
@app.get("/api/tenants")
async def list_tenants():
    """List every tenant the platform knows about. Used by the sidebar
    tenant switcher. Phase 5 will gate this behind operator-role auth."""
    config.load_env()
    from pathlib import Path as _P
    tenants_dir = _P(config.CONFIG_DIR) / "tenants"
    out: list[dict] = []
    for p in sorted(tenants_dir.glob("*.yaml")):
        if p.stem.startswith("_"):
            continue
        try:
            data = config.tenant_yaml(p.stem)
            out.append({
                "tenant_id":    p.stem,
                "display_name": data.get("display_name", p.stem),
            })
        except Exception:
            continue
    return {"tenants": out}


@app.get("/api/me")
async def me(tenant: str = "acme-test"):
    config.load_env()
    try:
        ctx = tenant_mod.load(tenant)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"tenant {tenant!r} not found")
    branding = config.branding()
    # Include each entitled OS's display name + suggestions for the sidebar.
    oses = []
    for os_name in ctx.entitled_oses:
        try:
            os_instance = registry.get(os_name)
            oses.append({
                "name": os_name,
                "display_name": os_instance.display_name,
                "version": os_instance.version,
            })
        except KeyError:
            continue
    return {
        "tenant_id": ctx.tenant_id,
        "display_name": ctx.display_name,
        "sandbox_enabled": bool(ctx.sandbox and ctx.sandbox.get("enabled")),
        "entitled_oses": oses,
        "app_env": config.APP_ENV,
        "branding": {
            "platform_name": branding.get("platform_name", "Platform"),
            "primary_color": branding.get("primary_color", "#5DCAA5"),
            "tagline": branding.get("platform_tagline", ""),
        },
    }


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
@app.get("/api/tenants/{tenant}/os/{os_name}/sessions")
async def list_sessions(tenant: str, os_name: str):
    return {"sessions": chat_db.list_sessions(tenant, os_name)}


class _NewSession(BaseModel):
    title: str | None = None


@app.post("/api/tenants/{tenant}/os/{os_name}/sessions")
async def create_session(tenant: str, os_name: str, body: _NewSession | None = None):
    title = (body.title if body else None) or "New chat"
    return chat_db.create_session(tenant, os_name, title=title)


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
@app.get("/api/sessions/{session_id}/messages")
async def list_messages(session_id: str, after: str | None = None):
    s = chat_db.get_session(session_id)
    if s is None:
        raise HTTPException(status_code=404, detail="session not found")
    return {"messages": chat_db.list_messages(session_id, after=after)}


class _NewMessage(BaseModel):
    content: str


@app.post("/api/sessions/{session_id}/messages")
async def post_message(session_id: str, body: _NewMessage):
    """Post a user message. Returns an SSE stream of the orchestrator's response.

    Persistence is handled by the orchestrator itself (when session_id is set
    on the TenantCtx). The SSE stream is a live view of the same events.
    """
    s = chat_db.get_session(session_id)
    if s is None:
        raise HTTPException(status_code=404, detail="session not found")

    tenant_id = s["tenant_id"]
    os_name = s["os_name"]
    handler = _OS_HANDLERS.get(os_name)
    if handler is None:
        raise HTTPException(status_code=400,
                            detail=f"no streaming handler for OS {os_name!r} yet")

    # Build a TenantCtx with session_id so the orchestrator persists messages.
    config.load_env()
    tctx = tenant_mod.load(tenant_id, session_id=session_id)

    async def event_stream():
        try:
            async for event in handler(body.content, tctx):
                yield f"data: {json.dumps(event)}\n\n"
                # Yield to the event loop so streaming feels live.
                await asyncio.sleep(0)
            yield "event: end\ndata: {}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering if proxied later
        },
    )


# ---------------------------------------------------------------------------
# Dashboard — aggregate view of pipeline + budgets + goals + opportunities
# ---------------------------------------------------------------------------
@app.get("/api/tenants/{tenant}/os/{os_name}/dashboard")
async def dashboard(tenant: str, os_name: str):
    """Single endpoint, one round-trip to produce everything the Dashboard
    pane renders. We sacrifice a little over-fetching for UI simplicity."""
    if os_name == "brief":
        return _brief_dashboard(tenant)
    if os_name != "sales":
        raise HTTPException(status_code=400,
                            detail=f"dashboard for OS {os_name!r} not implemented yet")

    # ----- lead funnel counts (one query per status — cheap enough for now)
    STATUSES = ["new", "enriched", "scored", "contacted", "replied",
                "meeting_booked", "disqualified"]
    funnel: dict[str, int] = {}
    for s in STATUSES:
        res = (
            sb_client().table("leads")
            .select("id", count="exact")
            .eq("tenant_id", tenant)
            .eq("status", s)
            .execute()
        )
        funnel[s] = res.count or 0

    # ----- top scored, awaiting or in-progress outreach
    top = (
        table("leads")
        .select("id,name,company,title,score,status")
        .eq("tenant_id", tenant)
        .gte("score", 0)
        .order("score", desc=True)
        .limit(6)
        .execute()
    ).data or []

    # ----- recent outreach (last 20) + inbound split
    recent = (
        table("outreach_events")
        .select("channel,direction,original_target,dispatched_to,sandbox,status,provider_id,subject,ts,lead_id")
        .eq("tenant_id", tenant)
        .order("ts", desc=True)
        .limit(20)
        .execute()
    ).data or []
    recent_inbound = [r for r in recent if r.get("direction") == "inbound"]
    inbound_count = (
        table("outreach_events")
        .select("id", count="exact")
        .eq("tenant_id", tenant)
        .eq("direction", "inbound")
        .limit(1)
        .execute()
    ).count or 0

    # ----- budgets (only active-period rows)
    from datetime import date as _date
    today = _date.today().isoformat()
    budgets = (
        table("external_budgets")
        .select("resource_key,period,period_start,period_end,limit_value,consumed")
        .eq("tenant_id", tenant)
        .eq("os_name", os_name)
        .lte("period_start", today)
        .gte("period_end", today)
        .execute()
    ).data or []
    for b in budgets:
        lim = float(b.get("limit_value") or 0)
        cons = float(b.get("consumed") or 0)
        b["pct"] = (cons / lim) if lim > 0 else 0

    # ----- goals + pacing status
    goals = (
        table("goals")
        .select("metric_name,target_value,current_value,period,period_start,period_end")
        .eq("tenant_id", tenant)
        .eq("os_name", os_name)
        .lte("period_start", today)
        .gte("period_end", today)
        .execute()
    ).data or []
    # Attach pace status via the budget engine's goal_status helper.
    for g in goals:
        status_obj = budget_engine.goal_status(tenant, os_name, g["metric_name"])
        if status_obj:
            g.update({k: v for k, v in status_obj.items()
                      if k not in ("target", "current")})

    # ----- customer-facing opportunity reports (unacked)
    opps = opportunity.unacked_for_audience(tenant, "customer", limit=20)

    # ----- scheduled cadence (pending follow-ups)
    from shared.db import cadence
    scheduled = cadence.list_upcoming(tenant, limit=25)
    if scheduled:
        ids = [s["lead_id"] for s in scheduled if s.get("lead_id")]
        lead_map: dict[str, dict] = {}
        if ids:
            leads_rows = (
                table("leads").select("id,name,company")
                .eq("tenant_id", tenant).in_("id", ids).execute()
            ).data or []
            lead_map = {r["id"]: r for r in leads_rows}
        for s in scheduled:
            lead = lead_map.get(s.get("lead_id")) or {}
            s["lead_name"] = lead.get("name")
            s["lead_company"] = lead.get("company")

    return {
        "os": {"name": os_name},
        "lead_funnel": funnel,
        "top_scored": top,
        "recent_outreach": recent,
        "recent_inbound":  recent_inbound,
        "inbound_total":   inbound_count,
        "budgets": budgets,
        "goals": goals,
        "opportunities": opps,
        "scheduled_cadence": scheduled,
    }


def _brief_dashboard(tenant: str) -> dict:
    """Brief OS dashboard payload — small by design.

    Tiles: total briefs, last brief generated, emailed-vs-chat-only split.
    Section: most recent 5 briefs (preview + emailed_to).
    Reuses the customer-audience opportunity reports tile so the surfaces
    look consistent across OSes."""
    total_res = (
        table("briefs").select("id", count="exact")
        .eq("tenant_id", tenant).limit(1).execute()
    )
    total = total_res.count or 0

    recent = (
        table("briefs")
        .select("id,generated_at,sections,content_md,emailed_to")
        .eq("tenant_id", tenant)
        .order("generated_at", desc=True)
        .limit(5)
        .execute()
    ).data or []
    # Trim content_md to a preview so the JSON stays small.
    for r in recent:
        body = r.get("content_md") or ""
        r["preview"] = (body[:280] + ("…" if len(body) > 280 else "")).strip()

    emailed_count = sum(1 for r in recent if r.get("emailed_to"))

    last_at = recent[0]["generated_at"] if recent else None

    opps = opportunity.unacked_for_audience(tenant, "customer", limit=10)

    return {
        "os": {"name": "brief"},
        "tiles": {
            "total_briefs": total,
            "last_generated_at": last_at,
            "emailed_recent": emailed_count,
        },
        "recent_briefs": recent,
        "opportunities": opps,
    }


# ---------------------------------------------------------------------------
# Acknowledge an opportunity report — dismisses the card
# ---------------------------------------------------------------------------
@app.post("/api/opportunities/{report_id}/acknowledge")
async def ack_opportunity(report_id: str):
    from datetime import datetime, timezone
    res = (
        table("opportunity_reports")
        .update({"acknowledged_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", report_id)
        .execute()
    )
    return {"acknowledged": len(res.data or [])}


# ---------------------------------------------------------------------------
# Operator pitches — cross-tenant view of operator-audience pitch reports
# ---------------------------------------------------------------------------
@app.get("/api/operator/pitches")
async def operator_pitches(tenant: str | None = None):
    """List unacked operator-audience pitch reports.

    Phase 4c: scope is whatever tenants exist in `config/tenants/*.yaml`.
    Pass `?tenant=...` to filter to a single tenant; omit for all tenants.
    The Phase 5 deploy hardens this behind operator-role auth.
    """
    if config.is_prod():
        raise HTTPException(status_code=404)
    config.load_env()
    q = (
        table("opportunity_reports")
        .select("id,tenant_id,os_name,pattern,severity,headline,body,payload,created_at")
        .eq("audience", "operator")
        .is_("acknowledged_at", "null")
        .order("created_at", desc=True)
        .limit(100)
    )
    if tenant:
        q = q.eq("tenant_id", tenant)
    rows = q.execute().data or []

    # Hydrate tenant display_name from per-tenant config (cached file reads).
    @_cache_on_first_call_lite
    def _display(t: str) -> str:
        try:
            return config.tenant_yaml(t).get("display_name", t)
        except FileNotFoundError:
            return t

    pitches = []
    for r in rows:
        payload = r.get("payload") or {}
        pitches.append({
            "id":              r["id"],
            "tenant_id":       r["tenant_id"],
            "tenant_display":  _display(r["tenant_id"]),
            "os_name":         r.get("os_name"),
            "pattern":         r.get("pattern"),
            "severity":        r.get("severity"),
            "headline":        r.get("headline"),
            "body":            r.get("body"),
            "candidate_os":    payload.get("candidate_os"),
            "candidate_status": payload.get("candidate_status"),
            "active_leads":    payload.get("active_leads"),
            "created_at":      r.get("created_at"),
        })

    # Tenant counts for the UI's "across N tenants" tile.
    from pathlib import Path as _P
    tenants_dir = _P(config.CONFIG_DIR) / "tenants"
    tenant_count = sum(1 for p in tenants_dir.glob("*.yaml") if not p.stem.startswith("_"))

    return {
        "pitches": pitches,
        "tenant_count": tenant_count,
        "pitch_count":  len(pitches),
    }


# Tiny memoizer for tenant_yaml lookups within a single request.
def _cache_on_first_call_lite(fn):
    cache: dict = {}
    def wrapper(arg):
        if arg in cache:
            return cache[arg]
        v = fn(arg)
        cache[arg] = v
        return v
    return wrapper


# Re-run the meta-OS scanner on demand for one or all tenants.
# Useful for the operator view's "Refresh pitches" button.
@app.post("/api/operator/scan")
async def operator_scan(tenant: str | None = None):
    if config.is_prod():
        raise HTTPException(status_code=404)
    config.load_env()
    from pathlib import Path as _P
    targets: list[str]
    if tenant:
        targets = [tenant]
    else:
        tenants_dir = _P(config.CONFIG_DIR) / "tenants"
        targets = sorted(p.stem for p in tenants_dir.glob("*.yaml") if not p.stem.startswith("_"))
    fresh_total = 0
    for t in targets:
        try:
            fresh = opportunity.run_for_tenant(t)
            fresh_total += len(fresh)
        except Exception as e:
            log.error("operator_scan_failed", extra={"tenant": t, "err": str(e)})
    return {"scanned_tenants": targets, "fresh_reports": fresh_total}


# ---------------------------------------------------------------------------
# Wizards — schema + submit. The browser renders an inline form in chat
# using the same Step/FieldInfo structure the CLI consumes.
# ---------------------------------------------------------------------------
@app.get("/api/wizards/{os_name}/schema")
async def wizard_schema(os_name: str, tenant: str = "acme-test"):
    try:
        os_instance = registry.get(os_name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    from shared.db import os_config as cfgdb
    from wizards.schema_json import serialize_schema
    active = cfgdb.active(tenant, os_name)
    return serialize_schema(
        os_name=os_name,
        os_title=os_instance.display_name,
        config_model=os_instance.config_schema,
        current_values=(active["config_json"] if active else {}),
        active_version=(active["version_number"] if active else None),
    )


class _WizardSubmit(BaseModel):
    os_name: str
    values: dict[str, Any]
    change_note: str | None = None


@app.post("/api/sessions/{session_id}/wizard/submit")
async def wizard_submit(session_id: str, body: _WizardSubmit):
    """Validate `values` against the OS's pydantic schema, save as a new
    os_config_versions row, and append a confirmation chat message."""
    s = chat_db.get_session(session_id)
    if s is None:
        raise HTTPException(status_code=404, detail="session not found")

    try:
        os_instance = registry.get(body.os_name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Validate via pydantic — returns a clean error list if anything's wrong.
    from pydantic import ValidationError
    try:
        instance = os_instance.config_schema(**body.values)
    except ValidationError as e:
        return {
            "ok": False,
            "errors": [
                {"loc": ".".join(str(p) for p in err.get("loc", ())),
                 "msg": err.get("msg", "")}
                for err in e.errors()
            ],
        }

    from shared.db import os_config as cfgdb
    saved = cfgdb.save(
        tenant_id=s["tenant_id"],
        os_name=body.os_name,
        config_json=instance.model_dump(exclude_none=False),
        change_note=body.change_note or "Edit via chat wizard",
        created_by="cli:web",
    )

    # Post a confirmation system message into the session so the user
    # sees the save in their chat history.
    chat_db.append_message(
        session_id=session_id, tenant_id=s["tenant_id"],
        role="system",
        content=f"Config saved as v{saved['version_number']}.",
        attachments=[{"kind": "config_saved",
                      "version_number": saved["version_number"],
                      "os_name":        body.os_name}],
    )
    chat_db.touch_session(session_id)
    return {"ok": True, "version_number": saved["version_number"]}
