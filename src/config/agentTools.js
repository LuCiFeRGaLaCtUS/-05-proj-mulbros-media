/**
 * Per-agent tool whitelist. Agent IDs not listed here get NO tools (text-only).
 * MO (meta-router) gets ALL tools — returned as `null` so toOpenAITools()
 * passes everything.
 *
 * Keep names in sync with src/config/tools.js TOOLS[].name.
 */

export const AGENT_TOOLS = {
  // ── Talent ───────────────────────────────────────────────────────────────
  'talent-audition-tracker': [
    'audition.create', 'audition.update_status',
    'industry_contact.create', 'industry_contact.find',
    'cost.snapshot',
  ],
  'talent-self-tape-coach': [
    'selftape.request_upload',
    'audition.update_status',
  ],
  'talent-agent-intermediary': [
    'resend.email', 'twilio.sms',
    'industry_contact.create',
  ],
  'talent-income-tax': [
    'plaid.link_token',
    'cost.snapshot',
  ],
  'talent-marketing-assistant': [
    'web.search',
  ],
  'talent-industry-intel': [
    'web.search',
  ],
  'talent-contract-reader': [
    // Contract reader doesn't send — only reads. No write tools yet.
  ],

  // ── Agency ───────────────────────────────────────────────────────────────
  'agency-roster-manager': [
    'roster.add',
    'industry_contact.create', 'industry_contact.find',
  ],
  'agency-opportunity-scout': [
    'web.search',
    'industry_contact.create',
  ],
  'agency-submission-drafter': [
    'submission.draft',   // HITL — saves as pending_approval
    'resend.email',       // HITL — confirmation
  ],
  'agency-commission-tracker': [
    'commission.create', 'commission.mark_collected',
    'cost.snapshot',
  ],
  'agency-contract-negotiator': [
    // HITL contract send via DocuSign — defer until contract.send tool exists.
  ],
  'agency-comms-relay': [
    'resend.email', 'twilio.sms',
  ],
  'agency-admin': [
    'cost.snapshot',
  ],

  // ── Touring (Sprint 9) ───────────────────────────────────────────────────
  'tour-manager': [
    'tour.create',
    'show.create', 'show.update_status', 'show.add_logistics',
    'industry_contact.create',  // promoters / venue mgrs
    'twilio.sms',               // reminders
  ],

  // ── Catalogue + royalties (Sprint 10) ────────────────────────────────────
  'catalogue-manager': [
    'release.create', 'track.add', 'split.set',
  ],
  'royalty-auditor': [
    'statement.parse',
  ],

  // ── EPK (Sprint 11) ──────────────────────────────────────────────────────
  'epk-builder': [
    'epk.upsert', 'epk.publish',
  ],
};

/**
 * Resolve allowed-tool list for a given agent id.
 * Returns `undefined` for MO (meta-router) → all tools.
 * Returns `[]` for an agent with no tool access (pure-text mode).
 */
export const getAllowedTools = (agentId) => {
  if (!agentId || agentId === 'mo' || agentId === 'universal') return undefined; // all tools
  return AGENT_TOOLS[agentId] || [];
};
