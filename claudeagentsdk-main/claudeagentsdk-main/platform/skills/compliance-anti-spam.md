---
name: compliance-anti-spam
version: 1
description: Baseline legal compliance for cold outreach — CAN-SPAM, GDPR, PECR, CASL, TCPA
applies_to: [bdr_outbound, sdr_inbound]
source_frameworks: [CAN-SPAM Act (US), GDPR/PECR (EU/UK), CASL (Canada), TCPA (US)]
---
## The non-negotiables

### Email (CAN-SPAM — US baseline, must-dos)
1. Accurate "From" name and address.
2. Non-deceptive subject line — must reflect body contents.
3. Identify the message as commercial if it is.
4. Include a valid physical postal address (company's).
5. Provide a clear opt-out (one-click or reply "STOP"). Honor within 10 business days (best-practice: immediately).

### Email (GDPR / PECR — EU/UK, stricter)
- B2B cold email to a business email is **legitimate interest** in most of the EU/UK, but STILL needs: clear identity + clear opt-out + no pre-tick boxes.
- B2C cold email → needs prior consent. Don't cold email consumers.
- If the prospect unsubscribes, DON'T store their email for future campaigns. Add to a permanent suppression list.

### SMS (TCPA — US)
- Marketing SMS to a wireless number requires prior express written consent. Transactional follow-up to an inbound lead: usually OK.
- Opt-out keyword ("STOP") must work. Reply "You've been unsubscribed."
- Dial-time rules: no marketing calls/SMS before 8am or after 9pm local.

### SMS (PECR — UK, CASL — Canada)
- UK: treat cold B2B SMS as risky. Default to email first.
- Canada: prior consent required. Single-touch B2B SMS outside an existing relationship = risky.

## Practical rules for this system
- Every outbound email must include an opt-out line.
- Every outbound SMS must identify the sender and include "Reply STOP to opt out."
- Before sending to a prospect, check `enrichment.unsubscribed_at`. If present, NEVER send.
- Before cold-dialing, check the local dial-time window for the prospect's TZ.
- If `enrichment.geo` is EU/UK and outreach is cold, prefer email over SMS/call.

## What to do when unsure
Don't send. Flag the lead with `enrichment.compliance_risk = true` and surface to the operator via HITL.
