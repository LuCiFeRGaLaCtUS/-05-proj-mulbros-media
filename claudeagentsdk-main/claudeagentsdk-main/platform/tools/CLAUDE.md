# /platform/tools — connector pattern

This directory holds **connectors** — adapters that reach external SaaS APIs. Connectors are the only place where third-party SDKs and HTTP clients get touched.

Loaded by Claude Code on top of [/CLAUDE.md](../../CLAUDE.md) and [/platform/CLAUDE.md](../CLAUDE.md).

## The connector layer's job

A connector turns a SaaS API into a **simple Python coroutine** that any OS's `*_tools.py` can call. It does **NOT** decide *when* to call the SaaS, *what* to send, or *who* to send to — those are decisions the subagent (judgment via skill, action via tool) owns.

```
Subagent → Tool (in oses/<os>/*_tools.py, @governed) → Connector (here, in tools/<name>.py) → SaaS API
```

A connector that contains business logic ("if customer is enterprise, send richer payload") is misplaced — that logic belongs in a skill or tool.

## Composio first, direct adapters second

**Always check Composio first.** [tools/composio.py](composio.py) is a thin wrapper around the Composio MCP. It already has access to ~250 toolkits (Gmail, Apollo, LinkedIn, HubSpot, Salesforce, Slack, Google Calendar, Notion, …). Using Composio means:

- One auth flow (`x-consumer-api-key` header) for every SaaS
- Centralized rate-limit + retry semantics
- A single audit surface (every Composio call is logged)
- No SDK version churn in this repo

**Fall back to a direct adapter only when no Composio toolkit covers the SaaS.** Today's direct adapters:
- [tools/twilio.py](twilio.py) — Twilio SMS (Composio has no SMS toolkit at the relevant tier)
- [tools/livekit.py](livekit.py) — LiveKit voice (no Composio toolkit)

When in doubt, run the diagnostic: [composio_diag.py](composio_diag.py).

## Direct adapter pattern (when Composio doesn't cover it)

Mirror [twilio.py](twilio.py). Required shape:

```python
"""<Service> connector — keep this file vendor-specific and logic-free."""
from __future__ import annotations

import os
from typing import Any

import httpx  # or the official SDK if it's stable


_API_BASE = "https://api.<service>.com/v1"


def _config() -> dict[str, str] | None:
    """Return creds dict or None if unconfigured. Tools handle the None gracefully."""
    api_key = os.getenv("<SERVICE>_API_KEY")
    if not api_key:
        return None
    return {"api_key": api_key, "base": _API_BASE}


async def do_thing(payload: dict[str, Any]) -> dict[str, Any]:
    """Call the SaaS. Return raw response. Caller handles persistence + audit."""
    cfg = _config()
    if not cfg:
        return {"status": "skipped", "reason": "<service> not configured"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{cfg['base']}/things",
                                  headers={"Authorization": f"Bearer {cfg['api_key']}"},
                                  json=payload)
        resp.raise_for_status()
        return resp.json()
```

Rules:
1. **Env-var driven config** — never hardcode keys; tenant-specific keys come from tenant config and get passed in.
2. **Return `{"status": "skipped", "reason": ...}`** if the connector is unconfigured. Tools that expect this shape can degrade gracefully.
3. **No `@governed`** on connectors — that decorator wraps tools, not connectors. The tool that calls the connector is the audit boundary.
4. **No DB writes from a connector.** Connectors are stateless; persistence happens in the tool.
5. **No tenant logic.** Connectors don't know about tenants — they just speak the SaaS protocol.
6. **One file per SaaS.** Don't bundle Twilio SMS + Twilio Voice + Twilio Verify in one file just because they share a vendor — splitting by capability keeps imports clean.

## Composio invocation pattern

[composio.py](composio.py) exposes `multi_execute(tool_id, params)` which dispatches to any Composio toolkit. Use it from a tool, not directly from a route or subagent prompt:

```python
# In oses/<os>/outbound_tools.py
from governance.middleware import governed
from tools.composio import multi_execute

@governed(name="mcp__<os>_outbound__send_email", cost={"key": "gmail_sends", "amount": 1})
async def send_email(tenant_id: str, to: str, subject: str, body: str) -> dict:
    # ... resolve sandbox redirect, format payload ...
    return await multi_execute("GMAIL_SEND_EMAIL", {
        "to": [resolved_to],
        "subject": subject,
        "body": body,
    })
```

See [reference_composio_mcp memory](#) (in the assistant's memory) for the current endpoint shape; do not bypass `multi_execute` to hit `/api/v3/actions/*/execute` directly — that's not the right endpoint for our key type.

## Tool registration — the bridge from connector to subagent

A tool that wraps a connector must:

1. **Live in the OS's `*_tools.py`** (not in `tools/`). E.g. Sales OS's email send is in [oses/sales/outbound_tools.py](../oses/sales/outbound_tools.py), not in `tools/`.
2. **Wrap with `@governed`** so it gets audit + budget + sandbox redirect.
3. **Be listed in the subagent's `TOOLS` allowlist** in `definition.py`.
4. **Be registered in [config/policies.yaml](../config/policies.yaml)** under the subagent's `tool_allowlist` so policies can scope it.
5. **Have a translation entry in [chat/translations.py](../chat/translations.py)** if it's exposed to chat-driven flows.

A connector with no tool referencing it is dead weight — delete it.

## Anti-patterns rejected for tools/connectors

- ❌ A FastAPI route in `apps/api/` calling `httpx.post()` directly to a SaaS. Route → subagent → tool → connector.
- ❌ A `tools/<service>.py` that contains tenant logic, prompt construction, or branching by lead state.
- ❌ A `tools/<service>.py` not referenced by any tool in any OS's `*_tools.py`.
- ❌ Multiple connectors for the same SaaS in different OSes — one connector per SaaS, all OSes share.
- ❌ Hardcoded timeouts shorter than 10s (some SaaS APIs spike to 20s+; use 30s+).
- ❌ Logging API keys, even in error paths.
- ❌ Bypassing `multi_execute` to make raw Composio HTTP calls.

## Adding a new connector — checklist

- [ ] Confirmed Composio doesn't already cover this SaaS (via `composio_diag.py` or Composio's docs)
- [ ] File at `tools/<service>.py` mirrors the [twilio.py](twilio.py) shape
- [ ] Reads creds from env vars; returns `{"status": "skipped"}` when unconfigured
- [ ] No `@governed` on connector functions (that wraps tools, not connectors)
- [ ] At least one tool in some OS's `*_tools.py` actually calls this connector
- [ ] That tool is registered in [config/policies.yaml](../config/policies.yaml) and listed in the subagent's `TOOLS`
