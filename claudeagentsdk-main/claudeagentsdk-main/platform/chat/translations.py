"""Map technical tool names to human-friendly chat labels.

`humanize(tool_name, tool_input)` returns a plain-language string. Never leak
raw `mcp__*` names into user-facing copy.

Special handling for Composio's meta-tool pattern — `COMPOSIO_MULTI_EXECUTE_TOOL`
wraps every real action (GMAIL_SEND_EMAIL, APOLLO_PEOPLE_SEARCH, etc.). Without
inspecting args, every Composio call looks identical in the UI. So we peek at
`tool_input["tools"][0]["tool_slug"]` and label the inner action instead.
"""
from __future__ import annotations

from typing import Any


# Direct name → label map for non-meta tools.
_LABELS: dict[str, str] = {
    # Composio meta-tools (the ones we can't resolve without args)
    "mcp__composio__COMPOSIO_SEARCH_TOOLS":       "Checking available tools",
    "mcp__composio__COMPOSIO_GET_TOOL_SCHEMAS":   "Reading tool schemas",
    "mcp__composio__COMPOSIO_MANAGE_CONNECTIONS": "Checking integrations",
    "mcp__composio__COMPOSIO_WAIT_FOR_CONNECTIONS": "Waiting for a connection to finish",
    # Sales internal
    "mcp__sales_internal__save_lead":    "Saving a new lead",
    "mcp__sales_internal__update_lead":  "Updating a lead's details",
    "mcp__sales_internal__list_leads":   "Looking through existing leads",
    "mcp__sales_internal__remember":     "Remembering this for next time",
    "mcp__sales_internal__recall":       "Recalling what worked before",
    "mcp__sales_internal__pick_channel": "Deciding the best channel",
    # Sales outbound
    "mcp__sales_outbound__send_email":   "Sending email",
    "mcp__sales_outbound__send_sms":     "Sending text message",
    "mcp__sales_outbound__place_call":   "Placing a call",
    "mcp__sales_outbound__request_approval": "Asking for your approval",
    # Brief OS internal
    "mcp__brief_internal__get_brief_context": "Gathering today's data",
    "mcp__brief_internal__save_brief":        "Saving the brief",
    # Agent invocation
    "Agent":                             "Handing off to specialist",
}


# Composio inner action slugs → labels (for messages wrapped in
# COMPOSIO_MULTI_EXECUTE_TOOL). When an agent dispatches through Composio,
# the REAL action is inside `input["tools"][i]["tool_slug"]`.
_COMPOSIO_ACTION_LABELS: dict[str, str] = {
    # Apollo
    "APOLLO_PEOPLE_SEARCH":          "Searching Apollo for matching prospects",
    "APOLLO_PEOPLE_ENRICHMENT":      "Looking up prospect details on Apollo",
    "APOLLO_ORGANIZATION_ENRICHMENT": "Looking up company info on Apollo",
    "APOLLO_ENRICH_PERSON":          "Enriching prospect via Apollo",
    "APOLLO_ENRICH_COMPANY":         "Enriching company via Apollo",
    # Gmail
    "GMAIL_SEND_EMAIL":   "Sending email via Gmail",
    "GMAIL_FETCH_MAILS":  "Checking Gmail inbox",
    "GMAIL_CREATE_DRAFT": "Drafting a Gmail message",
    # LinkedIn
    "LINKEDIN_SEARCH_PEOPLE":    "Searching LinkedIn",
    "LINKEDIN_GET_MY_PROFILE":   "Reading LinkedIn profile data",
    "LINKEDIN_SEARCH_COMPANIES": "Searching LinkedIn for companies",
    # HubSpot
    "HUBSPOT_CRM_CONTACTS_GET_ALL":     "Pulling contacts from HubSpot",
    "HUBSPOT_CRM_CONTACTS_GET_BY_ID":   "Fetching a HubSpot contact",
    "HUBSPOT_CRM_CONTACTS_CREATE":      "Saving a contact to HubSpot",
}


def _composio_inner_slug(tool_input: Any) -> str | None:
    """Pull the inner tool_slug out of a COMPOSIO_MULTI_EXECUTE_TOOL call's args.
    Shape: {tools: [{tool_slug: "GMAIL_SEND_EMAIL", arguments: {...}}, ...]}"""
    if not isinstance(tool_input, dict):
        return None
    tools = tool_input.get("tools")
    if not isinstance(tools, list) or not tools:
        return None
    first = tools[0]
    if isinstance(first, dict):
        slug = first.get("tool_slug")
        if isinstance(slug, str):
            return slug
    return None


def _prettify_leaf(tool_name: str) -> str:
    """Fallback: turn the trailing segment into a readable label."""
    leaf = tool_name.split("__")[-1].replace("_", " ")
    return leaf.strip().capitalize() or "Working"


def humanize(tool_name: str, tool_input: Any = None) -> str:
    """Render a technical tool call as a plain-language label. Peeks at
    tool_input for Composio's meta-tool pattern so each action reads distinctly."""
    # Composio meta-tool? Pull the inner action slug if present.
    if tool_name == "mcp__composio__COMPOSIO_MULTI_EXECUTE_TOOL":
        inner = _composio_inner_slug(tool_input)
        if inner and inner in _COMPOSIO_ACTION_LABELS:
            return _COMPOSIO_ACTION_LABELS[inner]
        if inner:
            # Unknown Composio action — still better than "Composio multi execute tool"
            return f"Running {inner.lower().replace('_', ' ')}"

    if tool_name in _LABELS:
        return _LABELS[tool_name]

    return _prettify_leaf(tool_name)
