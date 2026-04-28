"""Demo seeder — inserts 3 pre-enriched leads for a tenant.

Use when you want to exercise the scoring + BDR pipeline without live
sourcing (Apollo exhausted, demo-mode, or reproducible testing). All
email addresses are synthetic; sandbox mode redirects outbound to the
operator's contact regardless.

Usage:
    python -m shared.db.demo_seed --tenant acme-test
    python -m shared.db.demo_seed --tenant acme-test --clear     # wipe first
"""
from __future__ import annotations

import argparse
import sys

from shared import config, logging as plog
from shared.db.supabase import client, table

log = plog.get("demo_seed")


SEED_LEADS: list[dict] = [
    {
        "name": "Alex Brightwood",
        "title": "VP Sales",
        "company": "Modulr Finance",
        "company_domain": "modulrfinance.com",
        "email": "alex.brightwood@modulrfinance.com",
        "phone": "+441234567890",
        "linkedin_url": "https://www.linkedin.com/in/demo-alex-brightwood",
        "company_size": "201-1000",
        "company_revenue": "$50M-$100M",
        "industry": "Fintech",
        "location": "London, UK",
        "tech_stack": ["Salesforce", "Segment", "Snowflake", "dbt"],
        "source": "demo-seed",
        "status": "enriched",
        "enrichment": {
            "funding_stage": "Series C",
            "last_funding_months_ago": 8,
            "open_roles": ["Senior BDR", "Enterprise AE", "Sales Engineer"],
            "recent_news": [
                "Modulr announced a $108M Series C in mid-2025",
                "Launched new embedded payments product for B2B SaaS",
            ],
            "email_source": "demo-seed",
            "hooks": [
                {"source": "linkedin", "text": "Posted about compressing BDR ramp from 90 to 45 days"},
                {"source": "company", "text": "Fresh Series C + scaling revenue team"},
                {"source": "tech", "text": "Uses Snowflake/dbt — pipeline visibility opportunity"},
            ],
        },
    },
    {
        "name": "Priya Malhotra",
        "title": "Head of Revenue",
        "company": "iwoca",
        "company_domain": "iwoca.co.uk",
        "email": "priya.malhotra@iwoca.co.uk",
        "phone": None,
        "linkedin_url": "https://www.linkedin.com/in/demo-priya-malhotra",
        "company_size": "51-200",
        "company_revenue": "$10M-$50M",
        "industry": "Fintech",
        "location": "London, UK",
        "tech_stack": ["HubSpot", "Apollo", "Gong", "Outreach"],
        "source": "demo-seed",
        "status": "enriched",
        "enrichment": {
            "funding_stage": "Series D",
            "last_funding_months_ago": 14,
            "open_roles": ["BDR", "Revenue Operations Manager"],
            "recent_news": [
                "iwoca crossed £3B in SME lending milestone",
                "Press mention about challenges scaling outbound at SME-fintech",
            ],
            "email_source": "demo-seed",
            "hooks": [
                {"source": "linkedin", "text": "Recently posted about outbound-qualified pipeline targets"},
                {"source": "company", "text": "Just hit £3B lending milestone"},
                {"source": "tech", "text": "Uses Gong + Outreach — full modern RevOps stack"},
            ],
        },
    },
    {
        "name": "Nathan Crowther",
        "title": "VP Sales",
        "company": "Currencycloud",
        "company_domain": "currencycloud.com",
        "email": "nathan.crowther@currencycloud.com",
        "phone": "+441234567891",
        "linkedin_url": "https://www.linkedin.com/in/demo-nathan-crowther",
        "company_size": "201-1000",
        "company_revenue": "$100M-$250M",
        "industry": "Fintech",
        "location": "London, UK",
        "tech_stack": ["Salesforce", "Marketo", "LinkedIn Sales Navigator"],
        "source": "demo-seed",
        "status": "enriched",
        "enrichment": {
            "funding_stage": "Acquired by Visa",
            "last_funding_months_ago": 36,
            "open_roles": [],
            "recent_news": [
                "Operating as a Visa subsidiary since acquisition",
                "Product expansion into APAC markets",
            ],
            "email_source": "demo-seed",
            "hooks": [
                {"source": "company", "text": "APAC expansion announced in Q1 2026"},
            ],
            "caveat": "Post-acquisition — buyer autonomy may be reduced",
        },
    },
]


def _ensure_tenant_exists(tenant_id: str) -> None:
    res = table("tenants").select("tenant_id").eq("tenant_id", tenant_id).limit(1).execute()
    if not res.data:
        print(f"error: tenant {tenant_id!r} doesn't exist. Run `make bootstrap` first.",
              file=sys.stderr)
        sys.exit(2)


def _clear_demo_leads(tenant_id: str) -> int:
    """Delete any prior demo-seeded leads for this tenant. Safer than blind
    wipe — only touches rows with source='demo-seed'."""
    res = (
        table("leads")
        .delete()
        .eq("tenant_id", tenant_id)
        .eq("source", "demo-seed")
        .execute()
    )
    return len(res.data or [])


def seed(tenant_id: str, clear: bool = False) -> list[str]:
    config.load_env()
    _ensure_tenant_exists(tenant_id)

    if clear:
        deleted = _clear_demo_leads(tenant_id)
        print(f"  cleared {deleted} prior demo lead(s)")

    lead_ids: list[str] = []
    for row in SEED_LEADS:
        payload = {"tenant_id": tenant_id, **row}
        resp = client().table("leads").insert(payload).execute()
        lid = resp.data[0]["id"] if resp.data else None
        if lid:
            lead_ids.append(lid)
            print(f"  + {row['name']} @ {row['company']}  (status=enriched, id={lid[:8]}…)")
    return lead_ids


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--tenant", required=True)
    p.add_argument("--clear", action="store_true",
                   help="Delete prior demo-seed rows for this tenant first (idempotent reseed)")
    args = p.parse_args()

    print(f"\nSeeding demo leads for tenant {args.tenant!r}:")
    ids = seed(args.tenant, clear=args.clear)
    print(f"\nSeeded {len(ids)} lead(s). They're status='enriched' — ready for the scorer.\n")
    print("Next: run")
    print("  make smoke    # or")
    print(f"  ../.venv/bin/python -m apps.cli --tenant {args.tenant} --os sales --brief \\")
    print("    \"Score my enriched leads and send outreach to the top 2\"")


if __name__ == "__main__":
    main()
