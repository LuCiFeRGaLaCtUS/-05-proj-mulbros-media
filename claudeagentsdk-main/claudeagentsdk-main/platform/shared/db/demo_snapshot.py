"""Export a tenant's current state to a JSON bundle.

Use for leave-behinds after a demo ("here's what we showed, all persisted"),
for sharing with the team, or for reproducing issues later. Pair with the
audit_events manifests — any run can be re-played conceptually from a
snapshot + the relevant prompt/skill versions in git.

Usage:
    python -m shared.db.demo_snapshot --tenant acme-test
    # writes ./snapshots/<tenant>-<ts>.json
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from shared import config
from shared.db.supabase import table


def _collect(tenant: str) -> dict[str, Any]:
    """Pull everything relevant for the tenant in one JSON-serializable dict."""
    # Core config
    tenant_row = (table("tenants").select("*").eq("tenant_id", tenant).limit(1).execute()).data or []
    active_configs = (
        table("os_config_versions").select("*")
        .eq("tenant_id", tenant).eq("is_active", True).execute()
    ).data or []
    config_history = (
        table("os_config_versions").select("version_number,os_name,created_at,created_by,change_note,is_active")
        .eq("tenant_id", tenant).order("version_number", desc=True).limit(50).execute()
    ).data or []

    # Operational state
    leads = (table("leads").select("*").eq("tenant_id", tenant).order("created_at").execute()).data or []
    outreach = (
        table("outreach_events").select("*")
        .eq("tenant_id", tenant).order("ts").limit(500).execute()
    ).data or []

    # Memory chat
    sessions = (
        table("chat_sessions").select("*").eq("tenant_id", tenant)
        .order("last_active_at", desc=True).limit(50).execute()
    ).data or []
    messages = (
        table("chat_messages").select("*").eq("tenant_id", tenant)
        .order("created_at").limit(2000).execute()
    ).data or []

    # Meta-OS signals
    opps = (
        table("opportunity_reports").select("*").eq("tenant_id", tenant)
        .order("created_at", desc=True).limit(200).execute()
    ).data or []
    alerts = (
        table("variance_alerts").select("*").eq("tenant_id", tenant)
        .order("created_at", desc=True).limit(200).execute()
    ).data or []

    # Ledgers
    budgets = (
        table("external_budgets").select("*").eq("tenant_id", tenant).execute()
    ).data or []
    goals = (
        table("goals").select("*").eq("tenant_id", tenant).execute()
    ).data or []

    # Audit — summary counts only (full audit can be GBs; snapshots aren't meant
    # to carry the security record)
    audit_count = (
        table("audit_events").select("id", count="exact").eq("tenant_id", tenant).limit(1).execute()
    ).count or 0
    audit_recent = (
        table("audit_events").select("ts,agent_name,tool_name,policy_decision,sandbox")
        .eq("tenant_id", tenant).order("ts", desc=True).limit(50).execute()
    ).data or []

    return {
        "schema_version": 1,
        "generated_at":   datetime.utcnow().isoformat() + "Z",
        "tenant":         (tenant_row or [None])[0],
        "active_configs": active_configs,
        "config_history": config_history,
        "leads":          leads,
        "outreach_events": outreach,
        "chat": {"sessions": sessions, "messages": messages},
        "opportunity_reports": opps,
        "variance_alerts":     alerts,
        "external_budgets":    budgets,
        "goals":               goals,
        "audit_summary":       {"total": audit_count, "recent": audit_recent},
    }


def _default_output(tenant: str) -> Path:
    out_dir = Path(__file__).resolve().parents[2].parent / "snapshots"
    out_dir.mkdir(exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    return out_dir / f"{tenant}-{ts}.json"


def main() -> None:
    config.load_env()
    p = argparse.ArgumentParser()
    p.add_argument("--tenant", required=True)
    p.add_argument("--out", default=None, help="Output path; default: ./snapshots/<tenant>-<ts>.json")
    args = p.parse_args()

    print(f"\nSnapshotting tenant {args.tenant!r}...")
    bundle = _collect(args.tenant)
    out_path = Path(args.out) if args.out else _default_output(args.tenant)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(bundle, indent=2, default=str))
    size_kb = out_path.stat().st_size / 1024
    print(f"\n✓ wrote {out_path}")
    print(f"  {size_kb:.1f} KB · "
          f"{len(bundle['leads'])} leads · "
          f"{len(bundle['chat']['sessions'])} sessions · "
          f"{len(bundle['chat']['messages'])} messages · "
          f"{len(bundle['opportunity_reports'])} opps · "
          f"audit total={bundle['audit_summary']['total']}")


if __name__ == "__main__":
    main()
