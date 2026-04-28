---
name: firmographic-research
version: 1
description: Fill in company size, revenue, funding, industry, and location from available sources
applies_to: [lead_enricher]
source_frameworks: [Crunchbase / PitchBook / LinkedIn data hierarchies]
---
## When to use
When a lead has a company name or domain but the company fields are thin (size, revenue, stage, industry).

## Source priority
1. **Apollo company enrichment** (if domain present) — cheap, reliable for size/industry/stage. Cost: 1 Apollo credit.
2. **LinkedIn company page** — accurate for size bands, sometimes lists recent funding. Can be fetched via Composio LinkedIn lookup.
3. **Crunchbase** (via Composio if connected) — gold standard for funding, leadership. Higher cost.
4. **Company website** — about/pricing/careers pages reveal size + revenue hints. Free but LLM-parseable.
5. **BuiltWith / Wappalyzer** — for tech stack (see `technographic-lookup` skill).

## What to fill
| Column            | Good source              | Notes |
|-------------------|--------------------------|-------|
| `company_size`    | Apollo / LinkedIn band   | Store as band text ("51-200"), not raw number |
| `company_revenue` | Apollo / Crunchbase      | Band ("$1M-$10M") more useful than exact |
| `industry`        | Apollo / LinkedIn        | Normalize to the tenant's ICP industry list where possible |
| `location`        | LinkedIn / website footer | City + country |
| `enrichment.funding_stage`       | Crunchbase | "Series B", "Seed", "Bootstrapped" |
| `enrichment.last_funding_months_ago` | Crunchbase | int |
| `enrichment.hq_country`          | LinkedIn / website | ISO country code |

## Gaps vs over-spend
Not every gap is worth filling. Order of importance for sourcing + scoring:
1. `company_size`
2. `industry`
3. `location`
4. Funding stage (if the ICP includes a funding signal)
5. Revenue (rarely reliable, often over-stated)

Don't burn budget filling rarely-useful fields.

## Update approach
Merge with what's already there — never overwrite a stronger source with a weaker one. Apollo-sourced `company_size` shouldn't be replaced by a guess from the website.
