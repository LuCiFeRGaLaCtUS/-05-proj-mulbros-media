from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description=(
        "Produces a personalized cross-OS briefing. Reads pipeline state, "
        "recent opportunities, budget pacing, and outreach activity from the "
        "tenant's other OSes; assembles them into a markdown digest. Optionally "
        "Gmail-sends the brief if delivery_email is configured."
    ),
    handles=[
        "give me a brief",
        "morning brief",
        "today's brief",
        "what's happening today",
        "summarize my pipeline",
        "send me an update",
    ],
    does_not_handle=[
        "score leads",
        "send outreach",
        "source new prospects",
        "qualify inbound",
    ],
    example_briefs=[
        "Give me today's brief.",
        "Email me a morning brief.",
        "What's happening across the platform right now?",
    ],
    produces=["brief.generated"],
    consumes=["lead.*", "outreach.*"],
    order_hints={},
)
