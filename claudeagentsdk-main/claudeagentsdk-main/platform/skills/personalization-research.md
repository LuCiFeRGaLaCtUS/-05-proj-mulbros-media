---
name: personalization-research
version: 1
description: The 3x3 pattern — find 3 personalization hooks from 3 sources per prospect
applies_to: [bdr_outbound]
source_frameworks: [Jake Dunlap 3x3 research, Sales Hacker]
---
## The 3x3 pattern
For each prospect before first-touch outreach, spend ≤5 minutes gathering **3 hooks from 3 sources**.

### The 3 sources
1. **LinkedIn profile** — recent posts, role changes, shared articles, about section. Recent = last 90 days.
2. **Company signal** — fresh funding, product launch, press mention, key hire, tech stack change.
3. **Personal signal** (if present) — a podcast they were on, a conference they spoke at, a side project, a relevant opinion they posted.

### The 3 hooks
Pick the 3 strongest hooks from those sources. A hook is:
- **Specific** — names a thing, not a category. "Your Series B" not "your recent growth".
- **Relevant** — connects to the problem you solve, not random small-talk.
- **Fresh** — within 90 days preferred, 6 months max.

## How to use hooks in outreach
- **Email** — use 1 hook in the personalization sentence. Don't stack two.
- **SMS** — use the single strongest hook. SMS has no room for more.
- **Voice** — save the hook for AFTER they say "go ahead". Open with permission-based pattern first.

## Hooks that are NOT personalization
- The company's industry ("I saw you're in fintech").
- The prospect's job title ("As a VP of Sales…").
- A generic company compliment ("Impressive growth").
- Information they didn't voluntarily put in public ("I saw on your Apollo profile…").

## Rules
- If you can't find 3 hooks in 5 minutes, the lead may be too low-signal. Score it lower.
- Save the hooks you found in `enrichment.hooks: [{source, text, fetched_at}]` so downstream touches don't re-research.
- Never fabricate a hook. If you're not sure a post exists, say nothing.
