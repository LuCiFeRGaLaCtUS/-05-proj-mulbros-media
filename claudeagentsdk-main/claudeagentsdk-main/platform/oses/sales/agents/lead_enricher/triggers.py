from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Fills missing firmographic, contact, and technographic data on leads. Reads status='new' leads (or a caller-supplied ID list) and writes back the enriched fields + status='enriched'.",
    handles=[
        "enrich leads",
        "fill in missing data",
        "get contact info",
        "lookup emails for my leads",
    ],
    does_not_handle=[
        "source new prospects",
        "score leads",
        "send outreach",
    ],
    example_briefs=[
        "Enrich all my new leads with email and company domain",
        "Fill in phone numbers for my top 10 leads",
    ],
    produces=["lead.enriched"],
    consumes=["lead.sourced"],
    order_hints={"after": ["lead_sourcer"], "before": ["lead_scorer"]},
)
