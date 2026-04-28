"""PII redaction + prompt-injection heuristics.

Applied at tool boundaries where text leaves the operational boundary (mem0
writes) or comes back into an agent's view (mem0 reads, inbound payloads).
We deliberately do NOT redact in the operational record (leads table,
outreach_events) — that data is the business. We redact in:

    - Agent memory (mem0 remember / recall) — durable across runs, not
      per-lead. Should capture patterns, not specific people.
    - Audit args_hash / result_hash inputs — already pre-hashed elsewhere,
      but this gives belt-and-suspenders for any future code path that
      accidentally logs raw args.
    - Inbound payloads to SDR — scan for prompt-injection attempts before
      handing them to Claude.

Non-goals: we're not trying to be SOC 2 DLP. This is defense-in-depth on top
of skill-level guidelines, not a regulated data-loss-prevention system.
"""
from __future__ import annotations

import hashlib
import re

# ---------------------------------------------------------------------------
# Patterns — kept loose on purpose; false positives redact rarely-used
# identifiers but never leak real PII.
# ---------------------------------------------------------------------------
_EMAIL   = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
_PHONE   = re.compile(r"(?:(?<!\w)\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\w)")
_SSN     = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
# Start with digit, then 12-18 more digits optionally separated — stops at last
# digit cleanly (no trailing space swallowed).
_CC      = re.compile(r"\b\d(?:[ -]?\d){12,18}\b")


def _token(kind: str, value: str) -> str:
    h = hashlib.sha256(value.encode()).hexdigest()[:8]
    return f"<{kind}:{h}>"


def redact(text: str) -> str:
    """Return `text` with common PII replaced by short hashed tokens.

    Hashed tokens are stable for the same input — useful for pattern-mining
    memories without recovering the raw value (e.g. "<email:a1b2c3d4> bounced
    from modulrfinance.com" still carries the domain signal the agent wants).
    """
    if not text:
        return text
    out = _EMAIL.sub(lambda m: _token("email", m.group(0)), text)
    # Keep domain visible even after email redaction: "<email:xxx>@domain"
    # isn't what we want; the regex already replaced the whole email. That's
    # fine — agents learn domain patterns from the operational record.
    out = _SSN.sub(lambda m: _token("ssn", m.group(0)), out)
    out = _CC.sub(lambda m: _token("cc", m.group(0).replace(" ", "").replace("-", "")), out)
    # Phone last — order matters because earlier regexes can contain digits
    # that look phone-like. By running phone last on text already stripped of
    # emails, we avoid pulling "user@1234567890.example" matches.
    out = _PHONE.sub(lambda m: _token("phone", m.group(0)), out)
    return out


# ---------------------------------------------------------------------------
# Prompt-injection heuristics
# ---------------------------------------------------------------------------
_INJECTION_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # "ignore ... instructions" with any adjective chain between
    (re.compile(r"\bignore\b[\w\s]{0,60}?\binstructions?\b", re.I),
     "ignore-instructions jailbreak"),
    # "forget ... instructions / rules / programming"
    (re.compile(r"\bforget\b[\w\s]{0,60}?\b(instructions?|rules?|programming|prompt)\b", re.I),
     "forget-instructions jailbreak"),
    # "you are now" / "you must now" with a role change cue nearby
    (re.compile(r"\byou\s+(are|must)\s+now\b.{0,80}\b(as|be|act|pretend|unrestricted|jailbroken|DAN)\b", re.I),
     "role hijack pattern"),
    # Fake system role marker on its own line
    (re.compile(r"^\s*(system|assistant|user)\s*:", re.I | re.M),
     "fake role-marker line"),
    # XML-ish fake instruction tag
    (re.compile(r"<\s*\/?\s*(instructions?|prompt|system|rules)\s*>", re.I),
     "fake instruction tag"),
    # "disregard ... (rules|instructions|system|prompt)"
    (re.compile(r"\bdisregard\b[\w\s]{0,60}?\b(rules?|instructions?|system|prompt)\b", re.I),
     "disregard-instructions pattern"),
]


def scan_for_injection(text: str) -> list[str]:
    """Return a list of human-readable warnings if `text` looks like it's
    trying to steer the model. Empty list = nothing suspicious found."""
    if not text:
        return []
    findings: list[str] = []
    for pattern, label in _INJECTION_PATTERNS:
        if pattern.search(text):
            findings.append(label)
    return findings


def scrub_injection(text: str, marker: str = "[REDACTED-INJECTION]") -> str:
    """Replace hijack patterns with a neutral marker, preserving surrounding text.

    Unlike `scan_for_injection` this actively mutates the content. Use when
    you want to *still* feed the (safe) remainder to Claude, e.g. the body of
    an SDR inbound reply that happens to contain a hijack attempt."""
    if not text:
        return text
    out = text
    for pattern, _ in _INJECTION_PATTERNS:
        out = pattern.sub(marker, out)
    return out
