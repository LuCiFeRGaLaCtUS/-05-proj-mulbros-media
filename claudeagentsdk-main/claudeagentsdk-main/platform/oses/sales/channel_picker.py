"""Deterministic channel picker — pulls this decision out of the BDR prompt
and into testable Python.

Given a lead's enrichment, the tenant's outreach config, and live budget
state, decide which channel (voice / email / sms) to use — or skip the lead
entirely if no channel is viable right now. BDR still drafts the copy; it
just doesn't have to reason about the pick.

Default priority (respects `config.outreach.channels` allow-list):
    voice  — if phone present + voice allowed + budget ok
    email  — if email present + email allowed + not bounced + budget ok
    sms    — if phone present + sms allowed + budget ok

Compliance hook: a `geo` hint on the lead can flag risky jurisdictions
(EU/UK for cold SMS, US for pre-consent voice). Not blocking in v1 — just
downgrades voice/sms priority when unclear. Tenant's Advanced Settings can
tighten this.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any

from shared.db.supabase import table


@dataclass(frozen=True)
class PickResult:
    channel: str | None         # "voice" | "email" | "sms" | None (skip)
    reason:  str                # human-readable explanation
    skip:    bool               # True = no viable channel for this lead

    def as_json(self) -> dict[str, Any]:
        return {"channel": self.channel, "reason": self.reason, "skip": self.skip}


# ---------------------------------------------------------------------------
# Budget peek (one Supabase read per resource; cheap)
# ---------------------------------------------------------------------------
def _budget_has_capacity(tenant_id: str, os_name: str, resource_key: str) -> bool:
    """True iff the active-period budget has any remaining capacity.
    No-budget-row = no cap = allowed (matches budget.check_or_deny)."""
    today = date.today().isoformat()
    res = (
        table("external_budgets")
        .select("limit_value,consumed")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .eq("resource_key", resource_key)
        .lte("period_start", today)
        .gte("period_end", today)
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if row is None:
        return True  # no ledger = permissive
    limit = float(row.get("limit_value") or 0)
    consumed = float(row.get("consumed") or 0)
    return consumed < limit


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _has_email(lead: dict) -> bool:
    email = (lead.get("email") or "").strip()
    if not email or "@" not in email:
        return False
    enrichment = lead.get("enrichment") or {}
    return not bool(enrichment.get("email_bounced"))


def _has_phone(lead: dict) -> bool:
    return bool((lead.get("phone") or "").strip())


def _is_eu_uk_geo(lead: dict) -> bool:
    """Rough EU/UK heuristic from location string + enrichment.geo. Used to
    defer SMS/voice cold-outreach where PECR/TRAI make them risky."""
    loc = (lead.get("location") or "").lower()
    for hint in ("uk", "united kingdom", "london", "paris", "berlin", "dublin",
                 "germany", "france", "netherlands", "italy", "spain"):
        if hint in loc:
            return True
    enrichment = lead.get("enrichment") or {}
    country = str(enrichment.get("hq_country") or "").upper()
    return country in {"UK", "GB", "DE", "FR", "NL", "IT", "ES", "IE", "BE", "SE", "DK", "FI", "NO"}


# ---------------------------------------------------------------------------
# Main entry — pure function
# ---------------------------------------------------------------------------
def pick(
    *,
    tenant_id: str,
    os_name: str,
    lead: dict,
    outreach_config: dict | None,
) -> PickResult:
    """Decide the channel. Never sends anything. Never mutates state.
    Call from the BDR flow (via the `pick_channel` MCP tool) before drafting."""
    if lead is None:
        return PickResult(None, "lead not found", skip=True)
    if lead.get("status") == "disqualified":
        return PickResult(None, "lead is disqualified", skip=True)

    allowed = set((outreach_config or {}).get("channels") or ["email"])
    eu_uk = _is_eu_uk_geo(lead)

    # Priority 1: voice — highest-intent channel when we have phone + allowance
    if "voice" in allowed and _has_phone(lead):
        if eu_uk:
            # Cold voice in EU/UK is legally risky without prior relationship.
            # Defer unless the lead has some prior positive signal.
            prior_positive = (lead.get("enrichment") or {}).get("last_reply_class") == "positive"
            if not prior_positive:
                pass  # fall through to email
            else:
                if _budget_has_capacity(tenant_id, os_name, "voice_minutes"):
                    return PickResult("voice",
                                      "phone present + prior positive signal + voice allowed + budget ok",
                                      skip=False)
        else:
            if _budget_has_capacity(tenant_id, os_name, "voice_minutes"):
                return PickResult("voice",
                                  "phone present + voice allowed + budget ok (non-EU geo)",
                                  skip=False)

    # Priority 2: email — always cheap, works async, compliance-friendly
    if "email" in allowed and _has_email(lead):
        if _budget_has_capacity(tenant_id, os_name, "gmail_sends"):
            return PickResult("email",
                              "email present + email allowed + budget ok",
                              skip=False)
        else:
            return PickResult(None,
                              "email preferred but gmail_sends budget exhausted — skip for now",
                              skip=True)

    # Priority 3: SMS — last resort for personal-mobile leads
    if "sms" in allowed and _has_phone(lead):
        if eu_uk:
            return PickResult(None,
                              "SMS would be risky (EU/UK geo, no prior relationship) — skip",
                              skip=True)
        if _budget_has_capacity(tenant_id, os_name, "twilio_sms"):
            return PickResult("sms",
                              "phone present + sms allowed + budget ok",
                              skip=False)

    return PickResult(None,
                      "no viable channel — missing contact info, budget exhausted, or compliance risk",
                      skip=True)
