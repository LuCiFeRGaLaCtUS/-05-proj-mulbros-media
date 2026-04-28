---
name: cold-email-follow-up
version: 1
description: Follow-up email cadence (bump / value / break-up)
applies_to: [bdr_outbound]
source_frameworks: [Outreach.io / Lemlist cadence playbooks]
---
## The 4-touch cadence that works
| Touch | Gap | Pattern | Length |
|-------|-----|---------|--------|
| #1    | —   | First-touch (see `cold-email-first-touch`) | ≤100 words |
| #2    | +3 business days | **Bump** — reply to #1 in-thread, "Top of your inbox?" + one new angle | ≤40 words |
| #3    | +5 business days | **Value** — share something useful (short case study, peer quote, 1-page guide). Not a CTA. | ≤80 words |
| #4    | +7 business days | **Break-up** — "Sounds like now isn't the right time. I'll pause here. If something changes, feel free to reach out." | ≤30 words |

## What makes each touch different
- **Bump**: must add ONE new angle — a different peer example, a different question. Never "just following up".
- **Value**: gives without asking. The whole email is useful even if they ignore you.
- **Break-up**: actually stops. If they don't reply, the sequence ends. No touch #5.

## Reply threading
All 4 messages should thread on the original subject ("Re: ..."). Don't start new threads — kills open rates and looks like blast.

## When to skip a touch
- If open-tracker fires on touch #1 but no reply → still send #2 (they saw it).
- If touch #1 bounces → mark `enrichment.email_bounced = true`, STOP the cadence, requeue the lead for `lead-enricher` to find a better address.
- If they reply to any touch → STOP the cadence. Hand to SDR (`sdr_inbound`) immediately.

## Rules
- Never re-pitch in #2 or #3. Re-pitching is lazy and reads like blast.
- Never use sarcasm in #4. "Last email I'll send 🙂" reads passive-aggressive.
- After #4, move lead `status="disqualified"` unless there's a reason to try a new channel (SMS, voice).
