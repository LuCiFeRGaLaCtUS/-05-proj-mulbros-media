"""Composio client — direct MCP JSON-RPC over HTTP.

Why not the SDK? The Composio Python SDK expects a "Developer / Project" API
key; our `COMPOSIO_API_KEY` is a Consumer key (ck_*) scoped to the MCP URL.
Rather than ask the user to juggle two key types, we just reuse their existing
working MCP connection directly.

The Composio MCP endpoint (connect.composio.dev/mcp) accepts the Consumer key
via the `x-consumer-api-key` header and speaks Streamable HTTP MCP. We hit it
with a JSON-RPC `tools/call` and get the action executed against whatever
Composio toolkits are connected under that key's user (Gmail, Apollo, etc.).

This path has the bonus that it's the EXACT same wire the agent flow uses —
whatever works there works here.
"""
from __future__ import annotations

import json
import os
import uuid
from typing import Any

import httpx

from shared import logging as plog

log = plog.get("tools.composio")


class ComposioNotConfigured(RuntimeError):
    """COMPOSIO_MCP_URL or COMPOSIO_API_KEY is not set."""


class ComposioActionError(RuntimeError):
    """MCP returned an error or the action itself failed."""


def _endpoint() -> tuple[str, str]:
    url = os.environ.get("COMPOSIO_MCP_URL")
    key = os.environ.get("COMPOSIO_API_KEY")
    if not url:
        raise ComposioNotConfigured("COMPOSIO_MCP_URL is not set in .env")
    if not key:
        raise ComposioNotConfigured("COMPOSIO_API_KEY is not set in .env")
    return url, key


def _parse_sse(body: str) -> dict | None:
    """If Composio returned Server-Sent Events, extract the JSON from the last
    `data:` line."""
    last_data: str | None = None
    for line in body.splitlines():
        if line.startswith("data:"):
            last_data = line[len("data:"):].strip()
    if last_data:
        try:
            return json.loads(last_data)
        except json.JSONDecodeError:
            return None
    return None


def _call(method: str, params: dict) -> dict:
    """Send one JSON-RPC request to the Composio MCP endpoint."""
    url, key = _endpoint()
    request_id = str(uuid.uuid4())
    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": params,
    }
    headers = {
        "x-consumer-api-key": key,
        "Content-Type": "application/json",
        # Streamable HTTP spec: accept both; server picks.
        "Accept": "application/json, text/event-stream",
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, headers=headers, json=payload)
    except httpx.HTTPError as e:
        raise ComposioActionError(f"network error calling {method}: {e}") from e

    if resp.status_code >= 400:
        raise ComposioActionError(
            f"MCP {method} returned HTTP {resp.status_code}: {resp.text[:400]}"
        )

    # Body may be JSON or SSE.
    ctype = resp.headers.get("content-type", "")
    body_json: dict | None
    if "text/event-stream" in ctype:
        body_json = _parse_sse(resp.text)
        if body_json is None:
            raise ComposioActionError(f"MCP {method}: empty SSE response body")
    else:
        try:
            body_json = resp.json()
        except json.JSONDecodeError:
            raise ComposioActionError(f"MCP {method}: non-JSON response: {resp.text[:200]}") from None

    if "error" in body_json:
        err = body_json["error"]
        raise ComposioActionError(f"MCP {method} error: {err}")

    return body_json.get("result") or {}


def _extract_tool_text(result: dict) -> str:
    """MCP tool call result shape: {"content": [{"type":"text","text":"..."}], "isError": bool}"""
    content = result.get("content") or []
    texts: list[str] = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            texts.append(str(item.get("text", "")))
    return "\n".join(texts)


def execute(slug: str, arguments: dict[str, Any], *, thought: str | None = None,
            account: str | None = None) -> dict:
    """Execute a Composio toolkit action (e.g. GMAIL_SEND_EMAIL) via the
    MCP meta-tool `COMPOSIO_MULTI_EXECUTE_TOOL`.

    Composio's MCP does NOT expose individual toolkit actions directly — it
    only exposes 7 meta-tools. To invoke a real action, you wrap it in
    COMPOSIO_MULTI_EXECUTE_TOOL and pass the real slug in the body.
    """
    item: dict[str, Any] = {"tool_slug": slug, "arguments": arguments}
    if account:
        item["account"] = account
    params: dict[str, Any] = {"tools": [item]}
    if thought:
        params["thought"] = thought

    result = _call("tools/call", {
        "name": "COMPOSIO_MULTI_EXECUTE_TOOL",
        "arguments": params,
    })
    if result.get("isError"):
        text = _extract_tool_text(result) or "(no error text)"
        raise ComposioActionError(f"{slug} failed: {text}")

    text = _extract_tool_text(result)
    parsed: Any = None
    if text.strip().startswith(("{", "[")):
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None

    # multi_execute returns a list of per-tool results — check if the single
    # one we sent succeeded.
    results_list: list[dict] | None = None
    if isinstance(parsed, dict):
        results_list = parsed.get("results") or parsed.get("outputs")
    elif isinstance(parsed, list):
        results_list = parsed
    if results_list:
        first = results_list[0] if isinstance(results_list[0], dict) else {}
        if first.get("successful") is False or first.get("error"):
            raise ComposioActionError(f"{slug} returned error: {first.get('error') or first}")

    return {"text": text, "parsed": parsed, "raw": result}


# ---------------------------------------------------------------------------
# Typed wrappers. Tool slugs may vary across Composio workspaces — we accept
# overrides via env var so the user can tune without code changes.
# ---------------------------------------------------------------------------
def _tool_slug(default: str, env_var: str) -> str:
    return os.environ.get(env_var, default)


def gmail_send_email(*, to: str, subject: str, body: str) -> dict:
    """Send a Gmail via the MCP-connected Gmail toolkit.

    Arg names match Composio's GMAIL_SEND_EMAIL schema (from COMPOSIO_GET_TOOL_SCHEMAS):
    `to`, `subject`, `body` — NOT `recipient_email`.
    """
    slug = _tool_slug("GMAIL_SEND_EMAIL", "COMPOSIO_GMAIL_SEND_SLUG")
    return execute(
        slug,
        {"to": to, "subject": subject, "body": body},
        thought="Sandbox-gated outbound email from Sales OS BDR",
    )


# NOTE: Composio has no Twilio toolkit. SMS lives in tools/twilio.py.
