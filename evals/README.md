# MulBros Media OS — Eval Harness

Smoke-tests system prompts for the 14 Talent + Agency sub-agents.

## Running

```bash
OPENAI_API_KEY=sk-... node evals/run.js
OPENAI_API_KEY=sk-... node evals/run.js audition          # filter
```

Exits 0 if all fixtures pass, 1 on any failure (CI-friendly).

## Fixture shape

Each `evals/fixtures/*.json` has:
- `agent` — slug
- `model` — defaults to `gpt-4o-mini`
- `system` — system prompt under test (mirrors `src/config/agents.js`)
- `user` — sample user turn
- `must_contain` — array of regex patterns the response MUST match (case-insensitive)
- `must_not_contain` — regex patterns the response must NOT match

## Adding a fixture

Drop a new JSON into `fixtures/`. The runner picks it up automatically. Keep
patterns loose enough to tolerate variation but tight enough to catch regressions
(e.g. `"commission|10%"` not `"commission"`).
