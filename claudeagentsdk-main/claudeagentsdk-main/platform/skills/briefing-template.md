---
name: briefing-template
version: 1
description: Markdown structure for a daily / on-demand cross-OS briefing
applies_to: [briefer]
source_frameworks: [BLUF (Bottom Line Up Front), Stand-up format, Edward Tufte data-density principles]
---
A briefing should let the reader skim in 15 seconds and dive in 60. Lead with the verdict, then the evidence.

## Standard structure

```markdown
**Today's brief — <YYYY-MM-DD>**

<Opening line: greet by recipient_name, give the one-sentence verdict.
e.g. "Morning, Avi. Pipeline's healthy but outreach has stalled.">

### Pipeline
<2–4 bullets: status counts, top 1-2 scored leads with company + role.>

### Opportunities
<Up to 3 bullets — each is one short sentence: severity icon + headline.>

### Budgets
<1–2 bullets per active resource: name, consumed/limit, pct, status word
("comfortable", "watch", "tight").>

### Outreach
<1–3 bullets: counts in last 24h by channel/direction, OR "No outreach in
the last 24h" if empty.>

<Closing line, optional: one suggestion or call-out.>
```

## Rendering rules

- **Always include the date** in YYYY-MM-DD format in the title.
- **Order is fixed**: Pipeline → Opportunities → Budgets → Outreach. Skip a section ONLY if the tenant excluded it from `sections` config; never re-order.
- **An empty included section** prints a one-line acknowledgement, never disappears silently. ("No new opportunities.")
- **Severity icons** for opportunities: ⚠️ warning · ✨ opportunity · • info.
- **Budget status words**: ≤60% → comfortable · 60–80% → watch · >80% → tight.
- **Numbers**: integer counts plain ("12 leads"), percentages with `%` ("65% of plan"), money with `$` ("$2.40 spent").

## Length target

Under 250 words total. Compressing well-chosen numbers beats long prose. If something doesn't fit, it doesn't belong.
