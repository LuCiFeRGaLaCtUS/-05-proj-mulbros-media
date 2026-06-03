/**
 * Persona Router — maps user intent to a specific sub-agent.
 *
 * Strategy:
 *  1. If user starts message with `/<slug>` → map to that agent's id directly.
 *  2. Else → use MO meta-prompt (universal) with a list of available sub-agents.
 *
 * No new backend endpoint required — passes chosen system prompt to /api/ai.
 */
import { agents } from '../config/agents';
import { getAllowedTools } from '../config/agentTools';

const TOOLS_INSTRUCTION =
  '\n\nIMPORTANT — TOOLS ARE LIVE: You have function-calling tools available this turn. When the user asks you to log, create, send, schedule, look up, or otherwise act on something within your domain, CALL THE APPROPRIATE TOOL instead of describing what you would do. Confirm in plain language only AFTER the tool returns. If a required argument is missing, ask the user for it in one tight sentence. Never invent IDs or fields.';

const withToolsInstruction = (systemPrompt, allowedTools) =>
  (Array.isArray(allowedTools) && allowedTools.length === 0)
    ? systemPrompt
    : systemPrompt + TOOLS_INSTRUCTION;

// Slash command aliases — short form → agent.id.
// Keep aliases stable; users type these.
export const SLASH_COMMANDS = {
  // Talent
  audition:       'talent-audition-tracker',
  selftape:       'talent-self-tape-coach',
  'self-tape':    'talent-self-tape-coach',
  agent:          'talent-agent-intermediary',
  income:         'talent-income-tax',
  tax:            'talent-income-tax',
  marketing:      'talent-marketing-assistant',
  intel:          'talent-industry-intel',
  industry:       'talent-industry-intel',
  contract:       'talent-contract-reader',
  // Agency
  roster:         'agency-roster-manager',
  scout:          'agency-opportunity-scout',
  casting:        'agency-opportunity-scout',
  submission:     'agency-submission-drafter',
  submit:         'agency-submission-drafter',
  commission:     'agency-commission-tracker',
  negotiate:      'agency-contract-negotiator',
  comms:          'agency-comms-relay',
  inbox:          'agency-comms-relay',
  // Cross
  admin:          'agency-admin',
  cost:           'mulbros-intelligence',   // fallback for /cost (Platform Admin owns the real cost view)
  film:           'film-financing-discovery',
  music:          'composer-marketing',
  composer:       'composer-marketing',
};

/**
 * Build the MO meta-prompt that lets the universal agent route work internally
 * when no slash command was used.
 */
const buildMetaSystemPrompt = () => {
  const subAgentList = agents
    .filter(a => a.id !== 'universal' && a.id !== 'mulbros-intelligence')
    .map(a => `- ${a.id}: ${a.description || a.name}`)
    .join('\n');

  return `You are MO — the Media Operator AI for MulBros Media OS.

You are the user's single point of contact. You're warm, fast, decisive. Sound like a senior operator who's seen every audition tape and every contract redline. No filler. No corporate hedging.

You orchestrate a fleet of 21 specialized sub-agents. When the user's question fits a specific sub-agent's domain, you take on that sub-agent's persona and answer in their voice. You do not announce the handoff — you just answer correctly.

Available sub-agents (id: short description):
${subAgentList}

Rules:
1. Match the user's intent to the best sub-agent. If multiple fit, pick the most specific.
2. If the user asks something outside any sub-agent's domain, answer as MO directly using common sense + best-effort general media business knowledge.
3. Never apologize for not knowing. Either answer or ask one tight clarifying question.
4. When user types a slash command (/audition, /roster, etc.), they have already routed — match that sub-agent and answer in its voice.
5. Be concise. Default to 2–4 sentences unless complexity requires more.
6. Cite sources only when web search tool returns them — never fabricate URLs.`;
};

/**
 * Parse leading slash command from a user message.
 * Returns { command, rest } or { command: null, rest: message }.
 */
export const parseSlashCommand = (message) => {
  if (typeof message !== 'string') return { command: null, rest: message };
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) return { command: null, rest: message };
  // Match /<word> followed by space or end
  const m = trimmed.match(/^\/([a-z][a-z0-9-]*)\s*(.*)$/i);
  if (!m) return { command: null, rest: message };
  return { command: m[1].toLowerCase(), rest: m[2] };
};

/**
 * Resolve a slash command to an agent.id, or null if unknown.
 */
export const resolveSlashCommand = (command) => {
  if (!command) return null;
  return SLASH_COMMANDS[command] || null;
};

/**
 * Main entry — given the last user message, return the agent (full object) +
 * system prompt that should drive this turn.
 *
 * @param {string} userMessage   The latest user message text
 * @param {string} pinnedAgentId Optional — session is pinned to this agent (overrides slash)
 * @returns {{ agent: Agent, systemPrompt: string, slashCommand: string|null }}
 */
export const routeToAgent = (userMessage, pinnedAgentId = null) => {
  // 1. Session-pinned agent always wins (set via /agents picker or session create)
  if (pinnedAgentId) {
    const pinned = agents.find(a => a.id === pinnedAgentId);
    if (pinned) {
      const allowedTools = getAllowedTools(pinned.id);
      return {
        agent: pinned,
        systemPrompt: withToolsInstruction(pinned.systemPrompt, allowedTools),
        slashCommand: null,
        allowedTools,
      };
    }
  }

  // 2. Slash command in this turn
  const { command } = parseSlashCommand(userMessage);
  const slashTarget = resolveSlashCommand(command);
  if (slashTarget) {
    const matched = agents.find(a => a.id === slashTarget);
    if (matched) {
      const allowedTools = getAllowedTools(matched.id);
      return {
        agent: matched,
        systemPrompt: withToolsInstruction(matched.systemPrompt, allowedTools),
        slashCommand: command,
        allowedTools,
      };
    }
  }

  // 3. Default — MO meta-prompt with sub-agent catalog. MO gets ALL tools.
  return {
    agent:        { id: 'mo', name: 'MO', description: 'Media Operator' },
    systemPrompt: withToolsInstruction(buildMetaSystemPrompt(), undefined),
    slashCommand: null,
    allowedTools: undefined,  // undefined → all tools
  };
};

/**
 * For UI hint — return the list of slash commands available for autocomplete.
 */
export const getSlashCatalog = () =>
  Object.entries(SLASH_COMMANDS).map(([cmd, agentId]) => {
    const agent = agents.find(a => a.id === agentId);
    return {
      command:     `/${cmd}`,
      agentId,
      label:       agent?.name || agentId,
      description: agent?.description || '',
    };
  });
