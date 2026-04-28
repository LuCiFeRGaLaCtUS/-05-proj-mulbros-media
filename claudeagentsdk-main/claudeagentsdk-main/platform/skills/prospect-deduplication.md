---
name: prospect-deduplication
version: 1
description: Identify duplicate prospects across sources before saving
applies_to: [lead_sourcer]
source_frameworks: [Standard CRM identity-resolution]
---
## When to use
Before calling `save_lead`, check whether a matching prospect already exists for this tenant. Avoids duplicate outreach, preserves enrichment history, and protects budget.

## Matching priority (most → least reliable)
1. **Canonical LinkedIn URL**. Strip query strings + trailing slashes. `linkedin.com/in/jane-doe` is the canonical form.
2. **Verified email** (only if `email_source != "inferred"`).
3. **Company domain + first-name + last-initial**. e.g. `modulrfinance.com` + `Ross` + `L` — strong signal at small-to-mid companies.
4. **Company domain + exact normalized title**. Useful when names vary (nicknames, locale).

Rule: if any single strong match (1 or 2) fires, treat as duplicate. If (3) OR (4) match, flag for review.

## What to do with dupes
- If the existing record is `status='new'` or `'enriched'` → skip, don't re-save.
- If `status='scored'` → skip, but `remember` the new sighting as a signal ("still in market, saw them again on Apollo").
- If `status='disqualified'` or `'unsubscribed'` → do NOT re-save or re-contact. Skip silently.

## Implementation
Call `list_leads` with a narrowing query (domain filter via Supabase's `.like()` on `company_domain` works well), then apply the match rules in Python before `save_lead`.

## Common mistakes
- Trusting inferred emails as unique IDs. They aren't — always treat `email_source: "inferred"` as weak.
- Ignoring case/whitespace normalization. Strip + lower-case before comparing names.
