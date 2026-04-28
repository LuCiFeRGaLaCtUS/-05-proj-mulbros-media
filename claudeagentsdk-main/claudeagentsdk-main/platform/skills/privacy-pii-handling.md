---
name: privacy-pii-handling
version: 1
description: Baseline PII handling for agents — what to redact, what to store, what to speak
applies_to: [lead_sourcer, lead_enricher, lead_scorer, bdr_outbound, sdr_inbound]
source_frameworks: [GDPR Art. 5-6, CCPA baseline]
---
## PII you will handle
- Full names, email addresses, phone numbers, LinkedIn URLs
- Company-affiliated data (usually not PII, but treat emails as PII even when @company)
- Free-text enrichment that may contain personal info

## What to redact (in logs + audit + memory)
- Never write raw email addresses or phone numbers into `mem0` memories. Write patterns or categories: *"Inferred emails from acme.com used firstname.lastname pattern"* — not the exact email.
- Never include email/phone bodies in `audit_events.result_hash` inputs before hashing — hash protects you, but the original should not be logged verbatim.
- Scoring rationales use plain English — don't quote email text verbatim. Paraphrase.

## What to store
- Full PII can be stored in Supabase `leads`, `outreach_events` tables — that's the operational record.
- Row-level audit (`audit_events`) stores HASHED args + results, not raw content. That's intentional — audit for "did it happen" not "what was said".

## Speaking PII in chat
- The AI chat UI speaks naturally — it can say "I reached out to Ross at Modulr" but should not recite full email addresses back to the user unless the user asked.
- If the user asks a data question, fine to show the PII. If the AI is just narrating activity, keep it high-level.

## Deletion
- When `status="disqualified"` or `unsubscribe`, retain the minimum: (email, unsubscribed_at) in a suppression list. Drop the rest on request.
- On a GDPR deletion request, delete the lead row + cascade through outreach_events. Keep the suppression record.

## What this skill is NOT
Not a legal opinion. When in doubt, surface to the operator via HITL and stop.
