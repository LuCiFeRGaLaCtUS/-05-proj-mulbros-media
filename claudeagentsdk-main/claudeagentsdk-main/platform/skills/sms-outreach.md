---
name: sms-outreach
version: 1
description: Short, compliance-aware SMS outreach patterns
applies_to: [bdr_outbound]
source_frameworks: [TCPA (US), PECR (UK), Twilio best-practice guides]
---
## The shape
- ≤160 characters. One SMS, one thought. If it doesn't fit, email instead.
- Identify yourself: first name + company, e.g. *"Hey [First] — Ava here from Acme."*
- One specific reason + one low-friction question. No links on first SMS unless personalized.
- Sign with name + the opt-out clause: *"— Ava. Reply STOP to opt out."*

## When SMS beats email
- Mobile-first personas (field sales, operators, owner-operators).
- After an inbound form submission — "We saw you signed up, anything I can do to help?".
- Time-sensitive follow-up ("Your trial ends tomorrow — want to chat?").

## When NOT to SMS
- Never as the very first touch to a brand-new stranger in jurisdictions requiring opt-in (EU/UK, India, Canada). Get email consent first.
- Never after 8pm local or before 9am local time (TCPA + basic courtesy).
- Never to a generic corporate line. Only to a direct mobile.

## Regulatory guardrails
- **US (TCPA)**: no marketing SMS to wireless numbers without prior express written consent. Single transactional follow-up to an inbound lead is usually OK. When in doubt, send email.
- **UK/EU (PECR/GDPR)**: cold B2B SMS to mobile carries real risk. Restrict to opted-in leads.
- **India (TRAI)**: DND registry must be checked; use only registered sender IDs. Default to email.

## Sandbox note
In sandbox mode, SMS goes to the operator's test phone. Include the original target in the message prefix so the operator knows what was intended.
