---
name: apollo-search-query-builder
version: 1
description: Build effective Apollo people/company search queries from a structured ICP
applies_to: [lead_sourcer]
source_frameworks: [Apollo public search taxonomy]
---
## When to use
Before calling Apollo's people_search or company_search tools, translate a structured ICP into the specific filter parameters Apollo expects.

## Apollo filter mapping
| ICP field            | Apollo filter                                    |
|----------------------|--------------------------------------------------|
| `titles`             | `person_titles` (exact match preferred, not fuzzy) |
| `industries`         | `organization_industries` |
| `company_size_band`  | `organization_num_employees_ranges` — map: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+ |
| `geos` (country)     | `person_locations` as city/country string |
| `signals.fresh_funding` | `organization_latest_funding_stage_cd` or `organization_funding_age_in_months <= 12` |
| `signals.hiring`     | (no direct filter — use company growth signals or web search post-sourcing) |

## Query shape
- Start restrictive on title (1-3 exact titles) and size (1-2 bands).
- Keep geo as a filter, not a search term.
- Limit page size to 25 per call; paginate if needed to avoid blowing the credit budget.
- Prefer "people" search over "company" search when the end goal is an email address.

## Cost awareness
Each search result costs 1 credit when exported. Before exporting, confirm the count fits the tenant's goal + pacing — if budget denies the call, stop and report.

## Common mistakes
- Fuzzy title strings (e.g. "sales leader") match too broadly. Use exact titles.
- Including too many `organization_num_employees_ranges` — typically 2 bands max.
- Not verifying the result's email deliverability — flag inferred emails with `email_source: "inferred"`.
