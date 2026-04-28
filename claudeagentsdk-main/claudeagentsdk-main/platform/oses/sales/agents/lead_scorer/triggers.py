from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Scores enriched leads 0-100 on ICP fit using the tenant's rubric and prior scoring memory. Reads status='enriched' leads and writes score + rationale + status='scored'.",
    handles=[
        "score leads",
        "rank leads",
        "prioritize leads",
        "which leads should I focus on",
    ],
    does_not_handle=[
        "source new prospects",
        "enrich data",
        "send outreach",
    ],
    example_briefs=[
        "Score all my enriched leads 0-100",
        "Rank my pipeline by fit",
    ],
    produces=["lead.scored"],
    consumes=["lead.enriched"],
    order_hints={"after": ["lead_enricher"]},
)
