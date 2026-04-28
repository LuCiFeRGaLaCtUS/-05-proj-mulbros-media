from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Discovers NEW prospects matching the tenant's ICP from Composio toolkits (Apollo, LinkedIn, etc.). Writes candidates to Supabase with status='new'.",
    handles=[
        "source new leads",
        "find prospects",
        "grow the pipeline",
        "scrape leads",
        "we need more leads",
    ],
    does_not_handle=[
        "enrich existing leads",
        "score existing leads",
        "send outreach",
        "qualify inbound",
    ],
    example_briefs=[
        "Find 10 VP Sales at UK fintechs",
        "Source more leads in devtools",
        "We're off our monthly goal, scrape more leads",
    ],
    produces=["lead.sourced"],
    consumes=[],
    order_hints={"before": ["lead_enricher", "lead_scorer"]},
)
