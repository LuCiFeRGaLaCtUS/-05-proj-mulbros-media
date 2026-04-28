import asyncio
import os
import sys

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolUseBlock,
)
from dotenv import load_dotenv

from agents import build_agents
from tools import internal_mcp

load_dotenv()


ORCHESTRATOR_PROMPT = """You run a B2B lead-generation team of three specialist subagents:
- lead-sourcer: discovers new prospects from Composio toolkits (Apollo, LinkedIn, HubSpot, ...).
- lead-enricher: fills missing firmographic and contact data.
- lead-scorer: assigns a 0-100 fit score grounded in memory.

Rules:
1. Run them strictly in order: sourcer → enricher → scorer. Wait for each to finish before invoking the next.
2. Pass the user's original brief verbatim to the sourcer, plus any concrete constraints (count, ICP fields).
3. Between stages, briefly summarise what the previous subagent reported before invoking the next one.
4. At the end, present the top-scored leads (rank, company, title, score, one-line reason).
5. All persistence goes through the `internal` MCP tools — every lead lives in Supabase, every durable learning goes into mem0."""


def build_options() -> ClaudeAgentOptions:
    composio_url = os.environ.get("COMPOSIO_MCP_URL")
    if not composio_url:
        raise RuntimeError("COMPOSIO_MCP_URL is not set. See .env.example.")

    composio_headers: dict[str, str] = {}
    if api_key := os.environ.get("COMPOSIO_API_KEY"):
        composio_headers["x-consumer-api-key"] = api_key

    return ClaudeAgentOptions(
        system_prompt=ORCHESTRATOR_PROMPT,
        mcp_servers={
            "composio": {
                "type": "http",
                "url": composio_url,
                "headers": composio_headers,
            },
            "internal": internal_mcp,
        },
        agents=build_agents(),
        allowed_tools=[
            "Agent",
            "mcp__composio__*",
            "mcp__internal__save_lead",
            "mcp__internal__update_lead",
            "mcp__internal__list_leads",
            "mcp__internal__remember",
            "mcp__internal__recall",
        ],
        permission_mode="acceptEdits",
        max_turns=40,
    )


async def run(brief: str) -> None:
    async with ClaudeSDKClient(options=build_options()) as client:
        await client.query(brief)
        async for msg in client.receive_response():
            if isinstance(msg, SystemMessage) and msg.subtype == "init":
                servers = msg.data.get("mcp_servers", [])
                for s in servers:
                    status = s.get("status")
                    marker = "ok" if status == "connected" else status
                    print(f"[mcp] {s.get('name')}: {marker}")
            elif isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(block.text)
                    elif isinstance(block, ToolUseBlock):
                        print(f"[tool] {block.name}")
            elif isinstance(msg, ResultMessage):
                cost = msg.total_cost_usd or 0
                print(f"\n— done in {msg.num_turns} turns · ${cost:.4f}")


DEFAULT_BRIEF = (
    "Source 10 leads matching this ICP: VP Engineering or Head of Platform at "
    "US-based Series B SaaS companies (50-500 employees) in devtools or data "
    "infrastructure. Enrich each with email, LinkedIn, company domain, and "
    "revenue estimate. Score each lead 0-100 and return the ranked list."
)


if __name__ == "__main__":
    brief = " ".join(sys.argv[1:]).strip() or DEFAULT_BRIEF
    asyncio.run(run(brief))
