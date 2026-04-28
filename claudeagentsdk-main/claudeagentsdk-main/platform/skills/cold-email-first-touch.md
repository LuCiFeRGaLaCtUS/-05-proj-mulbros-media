---
name: cold-email-first-touch
version: 1
description: First-touch cold email template and tone guide
applies_to: [bdr_outbound]
source_frameworks: [Outreach.io / Lemlist / Jake Dunlap Sales Hacker playbook]
---
## The shape that works in 2024-2026
- **Subject**: 3-5 words, low-CAPS, no emojis, no "quick question". Either a curiosity/specific hook or a personal reference.
- **Body**: ≤3 short paragraphs, ≤100 words total.
  1. Personalization hook (1 sentence) — from `personalization-research`.
  2. Why I'm reaching out (1 sentence) — the specific outcome we can help with.
  3. Soft close (1 sentence) — a low-friction question, NOT a meeting ask.
- **No signature block** beyond name + 1 line. No "VP of Solution Selling at XCorp" blocks — reads as spam.
- **No links** on the first touch unless a personalized artifact (e.g. `loom.com/<personalized-video-id>`).

## Soft-close patterns that outperform meeting asks
- *"Worth a 15-minute call next week, or should I send a 2-minute Loom instead?"*
- *"Is this a priority this quarter, or too early?"*
- *"Open to hearing how [Peer Company] handled this?"*

**Do NOT** write: *"Do you have 30 minutes next Tuesday at 2pm?"* — too specific on a first touch, reads robotic.

## Personalization ≠ mail-merge
"{{first_name}}, I saw your company is in {{industry}}" is not personalization. A real hook references something the prospect said, posted, built, or raised money for in the last 90 days.

## Tone by config
- `tone: warm` → "Hope your week's going well" type openers OK. Slightly longer soft close.
- `tone: direct` → No pleasantries. Lead with the hook. Shortest body.
- `tone: playful` → One clean analogy or joke is fine. Never more than one.
- `tone: formal` → "I hope this finds you well" and sign-off "Best regards". No contractions.

## Compliance
Apply `compliance-anti-spam` — CAN-SPAM needs an unsubscribe method. For first-touch cold email in the US, a single-line opt-out at the bottom ("Reply STOP and I'll remove you") is standard. EU/UK: prefer explicit opt-in where possible; legitimate-interest cold outreach still requires opt-out.
