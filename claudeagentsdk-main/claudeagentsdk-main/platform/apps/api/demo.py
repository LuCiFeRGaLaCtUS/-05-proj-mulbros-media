"""Demo helper endpoints — power the 'Demo' sidebar's step buttons.

Every endpoint here is idempotent or clearly destructive. Destructive ones
(reset) require an explicit confirm flag in the body to avoid accidents.
Non-destructive ones (seed, meta-digest, snapshot, inbound-sample) just run
the existing modules.

These are tenant-scoped and meant for local dev / demos. Not intended to be
exposed to un-trusted callers.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from shared import config

router = APIRouter(prefix="/api/demo")


# ---------------------------------------------------------------------------
# Reset — destructive; require confirm=True
# ---------------------------------------------------------------------------
class _Reset(BaseModel):
    tenant: str
    confirm: bool = False


@router.post("/reset")
async def reset(body: _Reset):
    if not body.confirm:
        raise HTTPException(
            status_code=400,
            detail="Refusing to wipe operational state without confirm=true."
        )
    from shared.db import demo_reset
    config.load_env()
    try:
        demo_reset.reset(body.tenant)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"ok": True, "tenant": body.tenant, "note": "operational state wiped; config + audit preserved"}


# ---------------------------------------------------------------------------
# Seed — inserts 3 pre-enriched test leads
# ---------------------------------------------------------------------------
class _Seed(BaseModel):
    tenant: str
    clear: bool = True


@router.post("/seed")
async def seed(body: _Seed):
    from shared.db import demo_seed
    config.load_env()
    ids = demo_seed.seed(body.tenant, clear=body.clear)
    return {"ok": True, "seeded": len(ids), "lead_ids": ids}


# ---------------------------------------------------------------------------
# Meta-digest — runs the opportunity scanner once
# ---------------------------------------------------------------------------
class _MetaDigest(BaseModel):
    tenant: str


@router.post("/meta-digest")
async def meta_digest(body: _MetaDigest):
    from platform_os import opportunity
    config.load_env()
    fresh = opportunity.run_for_tenant(body.tenant)
    return {
        "ok": True,
        "new_reports": len(fresh),
        "reports": [
            {"audience": r.audience, "severity": r.severity,
             "pattern": r.pattern, "headline": r.headline}
            for r in fresh
        ],
    }


# ---------------------------------------------------------------------------
# Snapshot — exports tenant state to ./snapshots/<tenant>-<ts>.json
# Returns a download URL (served via /api/demo/snapshots/{filename})
# ---------------------------------------------------------------------------
class _Snapshot(BaseModel):
    tenant: str


_SNAPSHOTS_DIR = Path(__file__).resolve().parents[2].parent / "snapshots"


@router.post("/snapshot")
async def snapshot(body: _Snapshot):
    from shared.db.demo_snapshot import _collect
    config.load_env()
    _SNAPSHOTS_DIR.mkdir(exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"{body.tenant}-{ts}.json"
    out_path = _SNAPSHOTS_DIR / filename
    bundle = _collect(body.tenant)
    out_path.write_text(json.dumps(bundle, indent=2, default=str))
    size_kb = out_path.stat().st_size / 1024
    return {
        "ok":        True,
        "filename":  filename,
        "size_kb":   round(size_kb, 1),
        "leads":     len(bundle["leads"]),
        "sessions":  len(bundle["chat"]["sessions"]),
        "messages":  len(bundle["chat"]["messages"]),
        "download":  f"/api/demo/snapshots/{filename}",
    }


@router.get("/snapshots/{filename}")
async def download_snapshot(filename: str):
    # Defensive: filename must be a plain leaf (no path traversal)
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="bad filename")
    path = _SNAPSHOTS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="snapshot not found")
    return FileResponse(str(path), media_type="application/json", filename=filename)


# ---------------------------------------------------------------------------
# Inbound sample — simulates a reply from a specific lead (for the demo step)
# ---------------------------------------------------------------------------
class _InboundSample(BaseModel):
    tenant: str
    lead_name: str | None = None          # to pick a specific lead by name
    channel: str = "email"
    positive: bool = True                  # negative flavor for demo variety


@router.post("/inbound-sample")
async def inbound_sample(body: _InboundSample):
    """Fires a fake-but-realistic inbound reply through the normal webhook
    pipeline. Prefers the named lead if given; otherwise picks the first
    contacted lead."""
    import asyncio

    from apps.api.webhooks import _run_sdr
    from oses.sales.inbound import (
        InboundPayload,
        cancel_cadence_on_reply,
        build_sdr_brief,
        correlate,
        emit_inbound_event,
        record_inbound,
    )
    from shared.db import chat as chat_db
    from shared.db.supabase import table

    config.load_env()

    # Find a target lead.
    q = table("leads").select("*").eq("tenant_id", body.tenant)
    if body.lead_name:
        q = q.ilike("name", f"%{body.lead_name}%")
    else:
        q = q.eq("status", "contacted")
    lead_rows = (q.limit(1).execute()).data or []
    if not lead_rows:
        raise HTTPException(
            status_code=404,
            detail="No matching lead (pass a lead_name or have a contacted lead first).",
        )
    lead = lead_rows[0]

    # Pick a plausible reply body.
    if body.positive:
        reply_body = (
            f"Thanks — this actually lands at a good time for us. "
            f"We're hiring BDRs right now and your note about ramp-time is relevant. "
            f"How does pricing work? Happy to jump on a call Thursday or Friday."
        )
        subject = f"Re: {lead.get('company')} outreach"
    else:
        reply_body = (
            "Not a priority for us this quarter — circle back in Q3. "
            "Please remove me from this cadence."
        )
        subject = f"Re: {lead.get('company')} outreach — not now"

    payload = InboundPayload(
        tenant_id=body.tenant,
        channel=body.channel,
        from_address=lead.get("email"),
        subject=subject,
        body=reply_body,
        lead_id_hint=lead["id"],
    )

    correlated = correlate(payload)
    lead_id = correlated["id"] if correlated else None
    outreach_event_id = record_inbound(payload, lead_id)
    emit_inbound_event(payload, lead_id)
    cancelled = cancel_cadence_on_reply(payload, lead_id)

    session = chat_db.create_session(
        tenant_id=body.tenant, os_name="sales",
        title=f"Reply from {lead.get('name', 'lead')}",
    )
    brief = build_sdr_brief(payload, correlated)
    asyncio.create_task(_run_sdr(body.tenant, brief, session["id"]))

    return {
        "ok":               True,
        "from":             lead.get("email"),
        "flavor":           "positive" if body.positive else "negative",
        "outreach_event_id": outreach_event_id,
        "cancelled_follow_ups": cancelled,
        "session_id":       session["id"],
        "note":             "SDR is running in the background; dashboard will update within ~30s.",
    }
