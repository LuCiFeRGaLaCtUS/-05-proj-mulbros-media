---
name: technographic-lookup
version: 1
description: Detect a company's tech stack from its domain
applies_to: [lead_enricher]
source_frameworks: [BuiltWith / Wappalyzer signal taxonomies]
---
## When to use
When the ICP scoring rubric weights tech-stack fit (common in devtools/infra sales) or when the BDR needs a hook ("I saw you're using Snowflake…").

## Tools & priority
1. **BuiltWith via Composio** if connected — most reliable, costs per lookup.
2. **Wappalyzer** (free API) — decent signal, public HTTP check.
3. **Header inspection** — `Server:` header, `X-Powered-By`, cookies hint at stack. Cheap, weakest.
4. **Job posting scraping** — careers page + LinkedIn jobs often list "experience with Snowflake/dbt/K8s" etc. Slow but sometimes the strongest signal for infra tools.

## What to capture in `tech_stack`
Normalize names: "AWS", "Salesforce", "HubSpot", "Snowflake", "Segment" — canonical product names, not categories. Avoid vague entries like "JavaScript" or "database" — too generic to be useful.

## Signal quality rules
- Analytics/tag-manager presence (GA4, Segment, Mixpanel) ≠ strong buying signal. Everyone has these.
- Specific tools matching the tenant's sales pitch are gold. ("You use dbt → we compete with/complement dbt.")
- Hiring for specific stacks is the strongest signal. A job posting for "Senior Kafka Engineer" on acme.com beats a website script tag.

## Gotcha
Tech stack changes. If the latest reliable source is >6 months old, flag `enrichment.tech_stack_stale = true`.
