---
name: icp-fit-scoring
version: 1
description: Multi-dimensional 0-100 fit score for a single lead against the tenant's ICP
applies_to: [lead_scorer]
source_frameworks: [Predictable Revenue (Aaron Ross), MEDDIC]
---
## The rubric (default weights)
| Dimension                  | Range | What it captures |
|----------------------------|-------|------------------|
| Title fit                  | 0-30  | Exact / adjacent / lateral / mismatch |
| Company size fit           | 0-25  | Band match, over/under by 1 band, miss |
| Industry fit               | 0-20  | Primary industry match, secondary, miss |
| Geography fit              | 0-10  | In tenant's target geo; adjacent; far |
| Signal strength            | 0-15  | Fresh funding, hiring, tech adoption (see `intent-signal-weighting`) |
| **Total**                  | 0-100 | |

## Score bands & action thresholds
- **85-100**: Tier 1 — warm outreach same week.
- **70-84**: Tier 2 — standard outbound cadence.
- **50-69**: Tier 3 — nurture via marketing or low-effort outreach.
- **<50**: Disqualify or store for re-evaluation next quarter.

## How to apply
1. Fetch the tenant's `SalesConfig.icp` and memory of past scoring decisions.
2. Compute each dimension's score with brief reasoning in one phrase.
3. Sum to a total. Never scale; always 0-100.
4. The `score_rationale` field holds ONE tight sentence citing the primary driver — e.g. *"Exact title match at a UK-HQ'd Series B fintech; every ICP dimension satisfied."*

## Consistency rule
If mem0 recall returns prior scoring decisions for similar profiles, cite them:
- If you're scoring **higher** than past similar profiles without a stronger reason, adjust down.
- If you're scoring **lower**, name what's weaker than before.

## Tuning
Weights can be overridden per tenant in their Advanced Settings. If the tenant's industry is hyper-specific (e.g. "EU-regulated B2B fintech only"), `industry fit` should move toward 30, `title fit` toward 25.
