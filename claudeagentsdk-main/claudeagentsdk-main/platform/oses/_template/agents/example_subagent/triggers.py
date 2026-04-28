"""Example subagent triggers — replace with real intents.

The TriggerSpec is read by the OS pre-classifier (Haiku) to decide whether to
route a brief here. Be specific about what this subagent handles AND what it
explicitly does not — those negatives prevent mis-routing.
"""
from oses._protocol import TriggerSpec

SPEC = TriggerSpec(
    description="Replace with one sentence describing when this subagent runs.",
    handles=[
        "intent-this-handles",
    ],
    does_not_handle=[
        "intent-that-belongs-to-another-subagent",
    ],
    example_briefs=[
        "Concrete brief that should route here",
    ],
    produces=["event_type.emitted"],
    consumes=["event_type.consumed"],
    order_hints={"after": []},
)
