---
name: icp-parsing
version: 1
description: Parse ICP criteria from free-text into structured JSON
applies_to: [lead_sourcer, platform_classifier, bdr_outbound]
source_frameworks: [HubSpot Academy ICP templates, Outreach playbooks]
---
## When to use
Whenever you receive a free-text description of an ideal customer profile — in a brief, reply, or wizard answer — translate it into this shape:

```json
{
  "titles":            ["VP Sales", "Head of Revenue"],
  "industries":        ["Fintech", "Devtools"],
  "company_size_band": "51-200",
  "geos":              ["UK", "EU"],
  "signals":           ["Fresh Series B", "Hiring BDRs"]
}
```

## Rules
- Titles should be the person we want to reach, not their team or department. "VP Sales" not "sales team".
- Normalize common variants: "UK/United Kingdom/Britain" → "UK". "VP of Sales / VP Sales / SVP Sales" → "VP Sales".
- If the user says "startup" → `company_size_band = "11-50"`. "Mid-market" → "51-200" or "201-1000" depending on follow-up.
- Signals are **active** indicators (fresh funding, hiring, tech adoption) not static attributes (industry, size).
- If a field is genuinely unspecified, omit it. Don't invent.

## Common mistakes
- Confusing *industry* with *buyer persona*. "SaaS companies" is industry; "VP Eng at SaaS companies" has both.
- Treating geo as a country always. Sometimes users say "enterprise in North America" — geo is "US,CA".
- Over-constraining. The user rarely wants a 6-filter query on the first pass — prefer 2-3 strong filters and leave the rest open.
