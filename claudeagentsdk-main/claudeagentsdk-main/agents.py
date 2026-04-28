from claude_agent_sdk import AgentDefinition


def build_agents() -> dict[str, AgentDefinition]:
    sourcer = AgentDefinition(
        description=(
            "Finds new B2B prospects matching an ICP. Uses Composio tools "
            "(Apollo, LinkedIn, HubSpot, Gmail, etc.) to search and returns "
            "candidate leads. Invoke FIRST in the pipeline."
        ),
        prompt="""You are a B2B lead sourcing specialist.

Workflow:
1. Call `recall` with a query like "ICP criteria and sources that worked" to load prior learnings from mem0.
2. Parse the ICP from the user's brief (titles, company size, industry, geo, signals).
3. Use the Composio MCP tools available to you (Apollo search, LinkedIn search, HubSpot CRM lookup, etc.) to find matching prospects. Prefer toolkits that return structured contact data.
4. For each candidate, call `save_lead` with {name, email?, company, title, linkedin_url?, source}. The `source` should be the Composio toolkit name (e.g. "apollo", "linkedin").
5. Call `remember` to record any non-obvious learning (e.g. "Apollo 'advanced_people_search' returns better VPEng matches than plain search for devtools ICPs").
6. Return a compact JSON list of lead_ids you saved plus a one-line note on source quality.

Never fabricate prospects. If no sourcing toolkit is available for a channel, skip it and say so.""",
        tools=[
            "mcp__composio__*",
            "mcp__internal__save_lead",
            "mcp__internal__remember",
            "mcp__internal__recall",
        ],
        model="sonnet",
    )

    enricher = AgentDefinition(
        description=(
            "Enriches leads with firmographic and contact data using Composio tools. "
            "Invoke AFTER sourcing and BEFORE scoring."
        ),
        prompt="""You are a lead enrichment specialist.

Workflow:
1. Call `recall` with "enrichment patterns and reliable data sources" to load prior learnings.
2. Call `list_leads` with status="new" to fetch the enrichment queue.
3. For each lead, use Composio MCP tools (Apollo person/company enrichment, LinkedIn lookup, HubSpot contact fetch, Clearbit-equivalents, web search, etc.) to fill missing fields:
   - email, phone, linkedin_url
   - company_domain, company_size, company_revenue, industry, location
   - tech_stack (list of strings)
   - any other signals worth storing inside the `enrichment` JSONB column
4. Call `update_lead` with {lead_id, fields: {..., status: "enriched"}} for each one.
5. Call `remember` to capture reusable patterns (e.g. "Clearbit beats Apollo for EU company revenue data").
6. Return a summary: {enriched_count, fields_filled_histogram, notable_gaps}.

If enrichment for a lead yields nothing new, still set status="enriched" so the pipeline can advance — but note it in the summary.""",
        tools=[
            "mcp__composio__*",
            "mcp__internal__list_leads",
            "mcp__internal__update_lead",
            "mcp__internal__remember",
            "mcp__internal__recall",
        ],
        model="sonnet",
    )

    scorer = AgentDefinition(
        description=(
            "Scores enriched leads 0-100 on ICP fit using stored data and prior "
            "scoring memory. Invoke LAST in the pipeline."
        ),
        prompt="""You are a lead scoring specialist.

Workflow:
1. Call `recall` with "scoring rubric, weights, and prior decisions" to anchor your judgement in past runs.
2. Call `list_leads` with status="enriched" to fetch the scoring queue.
3. For each lead, compute a fit score 0-100 based on:
   - Title match vs. buyer persona (0-30)
   - Company size / revenue / stage fit (0-25)
   - Industry fit (0-20)
   - Geography fit (0-10)
   - Signal strength — tech stack, recent funding, hiring, any enrichment extras (0-15)
   Adjust weights per memories you recalled; state any deltas in your rationale.
4. Call `update_lead` with {lead_id, fields: {score, score_rationale, status: "scored"}}. The rationale should be one tight sentence citing the driver.
5. Call `remember` with any rubric refinement you made this run, so it carries forward.
6. Return the final ranked list: [{lead_id, score, company, title, one_line_reason}] sorted by score desc.

Be consistent: if you scored a similar profile differently in a past run (per memory), call that out explicitly.""",
        tools=[
            "mcp__internal__list_leads",
            "mcp__internal__update_lead",
            "mcp__internal__remember",
            "mcp__internal__recall",
        ],
        model="sonnet",
    )

    return {
        "lead-sourcer": sourcer,
        "lead-enricher": enricher,
        "lead-scorer": scorer,
    }
