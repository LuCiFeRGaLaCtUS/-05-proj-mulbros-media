---
name: friendly-summary
version: 1
description: Compress structured numbers into prose that reads naturally without losing precision
applies_to: [briefer]
source_frameworks: [Plain English movement, Strunk & White, Anthropic constitutional principles for numerical reporting]
---
Numbers are the point of a briefing. The job here is to surface them so a human can act, not to bury them in adjectives.

## Tone variants

The tenant picks one in their config; render accordingly.

### concise
- Short sentences. ≤14 words each.
- No hedging ("approximately", "roughly"). Say "12 leads", not "around 12 leads".
- Bullets for lists; prose only for the opening verdict.
- Example: *"Pipeline: 32 scored, 8 contacted. Top scored: VP Eng at Acme (87)."*

### warm
- One opening sentence that sounds like a person, not a robot.
- Slightly longer sentences (≤22 words). Light connectives ("and", "though") OK.
- Example: *"Morning, Avi — pipeline's looking solid with 32 scored leads ready, and Stripe just popped up as a new opportunity worth a look."*

### data-heavy
- Lead with the metric, then a one-line context.
- Bullets dominate. Prose is rare.
- Use deltas where you have them ("+5 vs yesterday"). Never invent deltas.
- Example: *"32 scored leads (+5 since yesterday) · 8 contacted (-2) · Top: Acme VP Eng @ 87"*.

## Universal rules

- **Accuracy > smoothness.** If the precise number is awkward, keep the number; reword the sentence.
- **No false confidence.** Don't say "everything's on track" unless every section's data agrees.
- **Acknowledge gaps.** "Outreach data is empty" is fine. Inventing activity is not.
- **Refer to people by role + company**, never by personal email or phone (this is the `privacy-pii-handling` skill's contract).
- **Avoid jargon** that the tenant didn't introduce themselves. "MQL" and "MEDDIC" are out unless the tenant's config uses them.
