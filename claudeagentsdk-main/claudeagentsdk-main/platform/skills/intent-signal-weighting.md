---
name: intent-signal-weighting
version: 1
description: How much weight each intent signal adds to a lead's score
applies_to: [lead_scorer]
source_frameworks: [G2 / Bombora intent models (simplified)]
---
## Why this matters
Two companies can look identical on static attributes (size, industry, geo) — what separates the "in-market now" one is signals. These are time-bounded; their value decays over 60-90 days.

## Default signal weights (out of the 15-point signal budget)
| Signal                                            | Points | Decay |
|---------------------------------------------------|--------|-------|
| Fresh funding (≤3 months)                         | 5      | -1pt/month |
| Fresh funding (3-12 months)                       | 3      | -0.2pt/month |
| Hiring for a role aligned to our offering         | 4      | stable while posting active |
| Adopted a competing/complementary tech (≤6 months)| 3      | -0.5pt/month |
| Leadership change in the buyer persona (new VP Sales, etc.) | 3 | -0.5pt/month |
| Press/PR mention aligned to our category          | 2      | -1pt/month |
| Website relaunch / product launch (≤3 months)     | 1      | -0.5pt/month |

Cap the total at 15. Sum all signals that apply, then cap.

## How to apply
Read the lead's `enrichment` JSON. Common keys to check:
- `enrichment.funding_stage` + `enrichment.last_funding_months_ago`
- `enrichment.open_roles` (list of titles)
- `enrichment.tech_stack` (vs. our competitors / complements)
- `enrichment.recent_news` (list of news items)

## Cite in rationale
When a signal contributes ≥3 points, name it in the `score_rationale` — not the points, but the fact.
Good: *"Fresh Series B + hiring 3 BDRs — strong buying signal."*
Bad: *"15/15 on signals."*

## What NOT to count
- Generic product news ("they hired an intern").
- Age-only signals (company founded recently = not a signal).
- Signals older than 12 months at the time of scoring.
