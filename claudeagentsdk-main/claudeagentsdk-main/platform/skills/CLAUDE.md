# /platform/skills — skill format and pattern

Skills give subagents **judgment**. Tools give them **action**. Connectors give them **reach**. This file is the contract for the skill layer.

Loaded by Claude Code on top of [/CLAUDE.md](../../CLAUDE.md) and [/platform/CLAUDE.md](../CLAUDE.md).

## What a skill is — and isn't

A skill is a **Markdown file** describing how a subagent should make a recurring judgment call: which template to choose, when to escalate, how to phrase a refusal, what tone to take, what NOT to write. Skills are versioned, gated to specific subagents, and injected into the subagent's prompt at build time.

Skills are **NOT**:
- ❌ Code. Skills do not contain `if/else` logic, loops, or branching the runtime executes. That goes in tools (action) or the orchestrator (routing).
- ❌ Generic prose ("be helpful", "be polite"). Skills capture **specific patterns** with named examples and counter-examples.
- ❌ Cross-cutting tone guidance scattered across many files. If two subagents need the same judgment, one skill applies to both.
- ❌ A place to dump documentation. Documentation goes in CLAUDE.md or doc strings.

## Frontmatter format (mandatory)

```markdown
---
name: <slug-matching-filename-without-md>
version: 1
description: <one-line description, ≤80 chars>
applies_to: [<subagent_name>, <subagent_name>, ...]
source_frameworks: [<framework or playbook name, optional>]
---
## <First section header>
...
```

Example: see [cold-email-first-touch.md](cold-email-first-touch.md).

### Field rules

- **`name`** — must match the filename without `.md`. The platform validator enforces this.
- **`version`** — integer. Bump when you make a breaking change to a shipped skill.
- **`description`** — one line, surfaced in subagent skill listings.
- **`applies_to`** — explicit list of subagent names. **Empty list is invalid** — every skill must apply to at least one subagent. The skill loader uses this to gate injection.
- **`source_frameworks`** — optional. Where the skill draws from (e.g. "MEDDIC", "Predictable Revenue", "Outreach.io playbook"). Useful for credibility audits.

## Body structure (what the skill itself looks like)

Lead with the **rule** or the **shape that works**. Then give:
- ≤2 concrete examples that follow the rule
- ≤2 counter-examples (anti-patterns) the subagent should NOT produce
- Conditional variants if the skill has knobs (e.g. tone variants, locale variants)

Keep skills under **~80 lines**. If a skill grows past that, split it — one judgment per skill.

## Skill vs. tool — the line we don't cross

| Question | Where it lives |
|---|---|
| "What template should I send first?" | Skill |
| "Send this email through Gmail." | Tool |
| "When should I escalate this reply?" | Skill |
| "Create a `hitl_requests` row." | Tool |
| "What tone fits this customer?" | Skill |
| "Persist the chosen tone in `leads.preferences`." | Tool |

If you find yourself writing branching logic in a tool's body that says "if cold lead, do X; if warm, do Y" — that's judgment. Move it to a skill and have the tool just take the parameter.

## The platform-wide skill set is shared across OSes

All skills live in this single directory regardless of which OS uses them. Gating is via `applies_to`. This means:

- Sales OS subagents and Marketing OS subagents may share a skill (e.g. `tone-professional-warm` could apply to both).
- A skill listed in two OSes' subagents is still **one file** — don't duplicate.
- When you add a new subagent in any OS, search this directory first for skills you can reuse before authoring new ones.

> ⚠️ Note: there's a stale `/platform/oses/sales/skills/` folder from earlier scaffolding. Treat it as deprecated — add new Sales skills here, not there.

## Anti-patterns rejected for skills

- ❌ A skill with `applies_to: []` or omitted `applies_to`.
- ❌ A skill that contains executable code or pseudocode the runtime is supposed to follow step-by-step. (Skills inform; tools execute.)
- ❌ A 300-line skill. Split it.
- ❌ Editing a shipped skill in place to "fix it" without bumping `version` if the change is breaking.
- ❌ Two skills covering the same judgment with slightly different rules. Consolidate.
- ❌ A skill that names a SaaS vendor in its body without abstraction (e.g. "use Smartlead's API"). Skills are vendor-agnostic; vendor specifics go in tools/connectors.

## Adding a new skill — checklist

- [ ] Filename is `<slug>.md` and matches frontmatter `name`
- [ ] `applies_to` lists at least one subagent that exists
- [ ] Each subagent listed has the skill's name in its `SKILLS_USED` list (otherwise the skill won't be injected)
- [ ] Body has ≥1 concrete example and ≥1 counter-example
- [ ] Under ~80 lines
- [ ] Searched the directory for an existing skill that already covers this judgment

## Adding a new skill — where the loader picks it up

The skill loader at [_loader.py](_loader.py) reads frontmatter, filters by `applies_to`, and the subagent's `build()` calls `skills.inject(...)` to splice skills into the system prompt. **You do not need to edit the loader.** Just drop a file with valid frontmatter, list it in your subagent's `SKILLS_USED`, and it will be picked up.
