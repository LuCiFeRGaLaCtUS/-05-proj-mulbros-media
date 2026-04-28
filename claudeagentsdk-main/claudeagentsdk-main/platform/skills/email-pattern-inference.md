---
name: email-pattern-inference
version: 1
description: Infer likely email addresses from first + last name + company domain
applies_to: [lead_enricher]
source_frameworks: [Hunter.io / Clearbit common patterns]
---
## When to use
When you have a prospect's full name and company domain but no email.

## Patterns, ranked by global frequency (2024 observed)
1. `{first}.{last}@{domain}`   — most common at mid/enterprise orgs
2. `{first}@{domain}`           — common at startups, early-stage
3. `{f}{last}@{domain}`         — common at banks, legal, traditional industries
4. `{first}_{last}@{domain}`    — less common, certain regions
5. `{last}{f}@{domain}`          — rare; EU legacy

`{first}`, `{last}` are all-lowercase, ASCII-normalized (é→e, ö→o), no hyphens, no spaces.

## Workflow
1. Try to verify via Apollo's email enrichment or Hunter.io finder if credits allow. That beats inference.
2. If inference is required:
   - Start with pattern #1 for mid/enterprise (size ≥ 51), #2 for small (size ≤ 50).
   - Record the inferred address, set `enrichment.email_source = "inferred"` and `enrichment.email_confidence = 0.6`.
   - Never send outbound to an inferred email without a second signal (LinkedIn URL verified, company-wide catch-all confirmed), unless the outreach config explicitly allows it.
3. If you produce multiple candidates (e.g. the name "Chris" could be first or last), flag the lead with `enrichment.email_ambiguous = true` and list candidates.

## What to avoid
- Catch-all domains (e.g. `info@`, `hello@`) — those are the COMPANY inbox, not the person.
- Sending to guessed emails from free-email domains (`@gmail.com`, `@yahoo.com`). Stop and flag.
- Generating emails for people whose title is "CEO" or "Founder" at small companies without verification — high noise, easy to annoy.
