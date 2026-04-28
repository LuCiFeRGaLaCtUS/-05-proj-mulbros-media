from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Handles inbound signals — replies to outbound, web-form submissions, inbound SMS/calls. Qualifies the lead (BANT/MEDDIC light), drafts a response, and hands off to BDR when warm.",
    handles=[
        "qualify inbound",
        "handle replies",
        "someone replied",
        "respond to inbound",
        "book a meeting",
    ],
    does_not_handle=[
        "source new prospects",
        "score whole pipeline",
        "outbound-first outreach",
    ],
    example_briefs=[
        "Qualify and respond to the latest reply from Kirsty",
        "Handle this inbound form submission",
    ],
    produces=["inbound.handled", "meeting.booked", "outreach.handed_off"],
    consumes=["outreach.replied", "inbound.received"],
)
