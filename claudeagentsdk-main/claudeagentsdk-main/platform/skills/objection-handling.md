---
name: objection-handling
version: 1
description: Respond to common sales objections (BANT tree)
applies_to: [sdr_inbound, bdr_outbound]
source_frameworks: [SPIN Selling, Sandler]
---
## The 4 canonical objections (BANT tree)

| Objection           | Real meaning (often)              | Response pattern |
|---------------------|-----------------------------------|------------------|
| **No budget**       | Low urgency / unclear ROI         | Show a quick ROI framing. *"Most of our customers in [peer-segment] see [outcome] in ~90 days. What would it take for this to be worth the cost of not solving it?"* |
| **No authority**    | Wrong contact OR they're hedging  | Ask: *"Who else should be part of this conversation? Happy to include them."* |
| **No need**         | Problem exists but isn't painful  | Ask: *"If the problem doesn't get worse, is it worth solving? If it does, when would it start to hurt?"* |
| **No timing**       | Priorities elsewhere              | Respect it. *"Totally fair. When might this come back to the top of the pile — quarterly planning? End of year?"* Then pause. |

## The universal "they're using a competitor" objection
> *"Great — how's it going? Most teams we talk to who've tried [competitor] tell us [specific gap]. Does any of that resonate, or is it working well for you?"*

Never trash the competitor. Ask about the fit.

## The "we built it in-house" objection
> *"Makes sense. Most of the teams who built it themselves run into [ongoing maintenance, updates, scale] after a year or two. Where are you on that curve?"*

Acknowledge the investment. Ask the question that re-opens the need.

## Rules
- Never push past a firm "no". Acknowledge it, note the reason, and leave a door open. Don't argue.
- If the prospect gives you a SPECIFIC objection (e.g. "we don't have GDPR support"), answer it directly. Don't deflect.
- If you can't answer an objection, say so and offer to come back — *"Let me get the exact numbers from our team and come back to you tomorrow."*
- Log objections in `enrichment.objections_heard` so we learn which ones are common for this ICP.
