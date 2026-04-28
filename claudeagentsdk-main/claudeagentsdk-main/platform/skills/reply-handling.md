---
name: reply-handling
version: 1
description: Classify inbound replies and route to the right response pattern
applies_to: [sdr_inbound]
source_frameworks: [Standard SDR reply taxonomy]
---
## The 6-class taxonomy

| Class           | Signals                                                  | Next action |
|-----------------|----------------------------------------------------------|-------------|
| **positive**    | "Interested", "tell me more", "let's chat"               | Qualify + propose time |
| **neutral/curious** | "Can you send more info?", "What's the pricing?"      | Answer + qualify |
| **objection**   | "Not now", "we use X already", "no budget"               | Apply `objection-handling` |
| **OOO**         | Auto-responder, "I'm on leave until DD-MM"              | Schedule follow-up after OOO |
| **unsubscribe** | "Stop", "Remove me", "Unsubscribe"                       | Disqualify + honor immediately |
| **negative**    | "Not interested" (firm), harsh tone                      | Disqualify, don't push |

## Classification rules
- If ANY phrase matches `unsubscribe` → treat as unsubscribe even if other text is warmer. Regulatory safety first.
- OOO auto-responders often still contain the real person's delegate. Capture the delegate contact in `enrichment.ooo_delegate`.
- "Not now" is ambiguous — look for a follow-up date or reason. If they name Q4, treat as `objection` with a scheduled retry, not disqualify.

## What to capture on every reply
- `enrichment.last_reply_class`
- `enrichment.last_reply_text_summary` (one line)
- `enrichment.last_reply_at`
- `enrichment.reply_sentiment_score` (-1 to 1, rough)

## Rules
- Never respond to the prospect with the CLASSIFICATION. Respond in natural language suited to the class.
- For `negative` replies, don't argue. Thank them for the clarity and move on.
- If a reply class is genuinely ambiguous, ask a clarifying question in the response; don't guess.
