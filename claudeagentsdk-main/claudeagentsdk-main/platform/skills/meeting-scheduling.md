---
name: meeting-scheduling
version: 1
description: Coordinate calendar + meeting handoff patterns
applies_to: [sdr_inbound]
source_frameworks: [Calendly / Chili Piper handoff playbooks]
---
## The "two-slot" ask (works when you have calendar access)
> *"Happy to chat — how about Thursday 2pm or Friday 11am your time? Either works on my end."*

- Name two specific times in the prospect's time zone.
- Keep them 24-48h apart (gives breathing room).
- Put your own time zone in the signature so there's no confusion.

## The "booking link" ask (works when you don't)
> *"Here's my calendar — grab any 20-minute slot that works: [booking-link]."*

- Use a link that only shows times available (Calendly/Chili Piper).
- Don't offer a link AND specific times — pick one pattern.

## Once they pick
- Confirm within 1 hour.
- Send a calendar invite with: purpose, agenda (3 bullets), who'll attend, expected outcome.
- Add a Zoom/Meet link. Never require them to set one up.

## Prepare before the meeting
Attach a short brief to the invite:
- One line: *"Why we're meeting"*
- Three lines: *"What I already know about [Company] and what I'd love to learn."*

Reduces the cold-start feel.

## If they no-show
- Wait 10 minutes.
- Send one message: *"Saw we didn't connect — anything I can do to make this easier? Happy to reschedule to a better time."*
- One reschedule attempt. If no response, move lead `status="disqualified"`.

## Time zone rules
- Always confirm TZ in the first offer. *"Thursday 2pm UK"* is safer than *"Thursday 2pm"*.
- Note their TZ in `enrichment.timezone` for future touches.
