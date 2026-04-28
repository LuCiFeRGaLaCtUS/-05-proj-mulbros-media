from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Runs outbound outreach on scored leads via email, SMS, and (Phase 3) voice. Picks the best channel based on enriched data + outreach rules. Sandboxed to the operator's contacts in test mode.",
    handles=[
        "send outreach",
        "reach out to leads",
        "start outbound",
        "email my top leads",
        "sms my top leads",
    ],
    does_not_handle=[
        "source new prospects",
        "enrich",
        "score",
        "handle inbound replies",
    ],
    example_briefs=[
        "Email the top 3 scored leads",
        "Run outreach on this week's qualified pipeline",
    ],
    produces=["outreach.sent", "outreach.failed"],
    consumes=["lead.scored"],
    order_hints={"after": ["lead_scorer"]},
)
