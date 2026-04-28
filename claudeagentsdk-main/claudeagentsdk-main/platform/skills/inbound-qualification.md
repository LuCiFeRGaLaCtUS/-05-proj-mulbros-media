---
name: inbound-qualification
version: 1
description: Lightweight BANT-style qualification for inbound leads
applies_to: [sdr_inbound]
source_frameworks: [BANT, MEDDIC (light)]
---
## The lightweight version

Don't interrogate inbound leads. Gather 3-4 signals across 2-3 exchanges, not all at once.

| Dimension         | Signal to capture | How to ask (natural) |
|-------------------|-------------------|----------------------|
| Need              | Problem they're trying to solve | *"What made you reach out today?"* |
| Timing            | Active evaluation vs research | *"Are you looking to solve this soon, or researching for later?"* |
| Budget / Authority | Are they evaluating, or someone they know is? | *"Are you looking into this for your team, or on behalf of someone?"* |
| Shortlist         | Who else are they looking at? | *"Have you looked at [category peers] too?"* |

## What "qualified" means
For a default tenant:
- **Need**: named a real problem (not browsing).
- **Timing**: this quarter, this month.
- **Authority OR Budget**: either directly or named decision-maker.

If 2 of 3 are clear, hand off to a human or propose a meeting. If only 1, send a value piece + `meeting-scheduling` offer and move on.

## Progressive profiling
Don't ask all 4 on the first reply — pace it across 2-3 messages. First reply focuses on Need + Timing. Second adds Authority. Third adds Shortlist if still engaged.

## Auto-disqualify patterns
- Student / research / thesis use cases.
- "Just curious" with no company mentioned.
- Email domain from a free provider (gmail/yahoo) AND no company in signature.

Mark as `enrichment.qual_notes` but don't spend more BDR time.

## Hand-off
Once qualified, update `status = "meeting_booked"` or `"replied-qualified"` and notify BDR (or the human operator). Hand off includes: summary of signals gathered, the prospect's exact words (not paraphrase), and proposed next step.
