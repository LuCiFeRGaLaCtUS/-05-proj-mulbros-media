/**
 * AI Operator — Tool registry (OpenAI function-calling schemas).
 *
 * Shared between server (handler dispatch) + client (which tools each agent
 * may invoke). Handlers live server-side in server.js, keyed by `name`.
 *
 * Convention: tool names use `domain.action` (audition.create).
 * `parameters` is JSON Schema 2020-12 minus $schema header (OpenAI accepts).
 * `mode: 'auto'` runs without user confirm. `mode: 'hitl'` shows
 *   Approve/Edit/Cancel card before server executes (e.g. submission.send).
 */

export const TOOLS = [
  // ── Auditions ────────────────────────────────────────────────────────────
  {
    name: 'audition.create',
    description: 'Create a new audition row for the signed-in talent. Use when the user describes an upcoming or just-logged audition.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        project_title:    { type: 'string',  description: 'Project / production name (e.g. "Netflix Pilot")' },
        role_name:        { type: 'string',  description: 'Role being read for' },
        casting_director: { type: 'string',  description: 'Casting director name if known' },
        audition_type:    { type: 'string',  enum: ['self_tape','in_person','callback','chemistry_read','screen_test'] },
        audition_at:      { type: 'string',  description: 'ISO timestamp of audition (or null)' },
        deadline:         { type: 'string',  description: 'ISO timestamp of submission deadline (or null)' },
        paying_rate:      { type: 'string',  description: 'Rate or scale (e.g. "$300/day, SAG scale")' },
        source_url:       { type: 'string',  description: 'Where the audition came from (Backstage URL, etc.)' },
        notes:            { type: 'string' },
      },
      required: ['project_title'],
      additionalProperties: false,
    },
  },
  {
    name: 'audition.update_status',
    description: 'Move an audition between pipeline stages: submitted, callback, booked, pass, no_response.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        audition_id: { type: 'string', description: 'UUID of the audition row' },
        status:      { type: 'string', enum: ['submitted','callback','booked','pass','no_response'] },
      },
      required: ['audition_id', 'status'],
      additionalProperties: false,
    },
  },

  // ── Roster (Agency) ──────────────────────────────────────────────────────
  {
    name: 'roster.add',
    description: 'Add a talent to the signed-in agency\'s roster.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        talent_name:      { type: 'string' },
        union_status:     { type: 'string', enum: ['SAG-AFTRA','Equity','Non-Union','Other'] },
        commission_pct:   { type: 'number', description: 'Agency commission percent (default 10)' },
        contact_email:    { type: 'string' },
        contact_phone:    { type: 'string' },
        notes:            { type: 'string' },
      },
      required: ['talent_name'],
      additionalProperties: false,
    },
  },

  // ── Commissions (Agency) ─────────────────────────────────────────────────
  {
    name: 'commission.create',
    description: 'Create a new commission row tied to a booking. Computes commission_due = amount_gross * (commission_pct/100).',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        talent_name:    { type: 'string', description: 'Name of the booked talent' },
        project_title:  { type: 'string' },
        amount_gross:   { type: 'number', description: 'Gross booking USD' },
        commission_pct: { type: 'number', description: 'Default 10' },
        due_date:       { type: 'string', description: 'ISO date when commission expected' },
      },
      required: ['talent_name', 'amount_gross'],
      additionalProperties: false,
    },
  },
  {
    name: 'commission.mark_collected',
    description: 'Mark a commission as collected. Sets status=collected + amount_collected.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        commission_id:     { type: 'string' },
        amount_collected:  { type: 'number' },
      },
      required: ['commission_id'],
      additionalProperties: false,
    },
  },

  // ── Industry contacts ────────────────────────────────────────────────────
  {
    name: 'industry_contact.create',
    description: 'Add a casting director, producer, agent, manager, or scout to the user\'s industry contacts.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        name:     { type: 'string' },
        role:     { type: 'string', enum: ['casting_director','producer','agent','manager','scout','other'] },
        company:  { type: 'string' },
        email:    { type: 'string' },
        phone:    { type: 'string' },
        notes:    { type: 'string' },
      },
      required: ['name', 'role'],
      additionalProperties: false,
    },
  },

  // ── Submissions (Agency, HITL) ───────────────────────────────────────────
  {
    name: 'submission.draft',
    description: 'Draft a submission email/note for a talent on a casting opportunity. HITL — saved as status=pending_approval until user approves.',
    mode: 'hitl',
    parameters: {
      type: 'object',
      properties: {
        talent_name:      { type: 'string' },
        casting_id:       { type: 'string', description: 'Casting feed row id or external ref' },
        cover_note:       { type: 'string', description: 'Draft pitch/cover note from the agent' },
        attachments:      { type: 'array', items: { type: 'string' } },
      },
      required: ['talent_name', 'cover_note'],
      additionalProperties: false,
    },
  },

  // ── Comms ────────────────────────────────────────────────────────────────
  {
    name: 'twilio.sms',
    description: 'Send a transactional SMS (booking confirmation, audition reminder). Uses the configured Twilio number.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        to:       { type: 'string', description: 'E.164 phone number, e.g. +14155551234' },
        message:  { type: 'string', description: 'Body, ≤1600 chars' },
      },
      required: ['to', 'message'],
      additionalProperties: false,
    },
  },
  {
    name: 'resend.email',
    description: 'Send a transactional email via Resend.',
    mode: 'hitl',
    parameters: {
      type: 'object',
      properties: {
        to:       { type: 'array', items: { type: 'string' }, description: '1-10 recipient email addresses' },
        subject:  { type: 'string' },
        html:     { type: 'string', description: 'HTML body (preferred)' },
        text:     { type: 'string', description: 'Plain text body (fallback)' },
      },
      required: ['to', 'subject'],
      additionalProperties: false,
    },
  },

  // ── Self-tape (Mux) ──────────────────────────────────────────────────────
  {
    name: 'selftape.request_upload',
    description: 'Return a Mux one-shot upload URL the user (or their device) can PUT a self-tape video to.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        title:        { type: 'string' },
        audition_id:  { type: 'string', description: 'Optional UUID of the audition this tape belongs to' },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  {
    name: 'stripe.onboard_link',
    description: 'Create a Stripe Connect onboarding link so the user can connect their bank for payouts.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        email:       { type: 'string' },
        return_url:  { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'plaid.link_token',
    description: 'Create a Plaid Link token so the user can connect their bank account for transaction sync.',
    mode: 'auto',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ── Cost / observability (read-only) ─────────────────────────────────────
  {
    name: 'cost.snapshot',
    description: 'Return the user\'s AI + integration spend snapshot for today, broken down by provider. Read-only.',
    mode: 'auto',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },

  // ── Search (read-only) ───────────────────────────────────────────────────
  {
    name: 'web.search',
    description: 'Search the web for current information (industry news, casting calls, financing leads) via OpenAI Responses API web_search.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
];

/**
 * Filter the registry to the OpenAI tools-array format for a given allow-list.
 * @param {string[]|undefined} allowedNames — agent's allowed-tool whitelist; if
 *   undefined, return ALL tools (default for MO meta-router).
 * @returns {Array<{ type: 'function', function: { name, description, parameters } }>}
 */
export const toOpenAITools = (allowedNames) => {
  const names = allowedNames ? new Set(allowedNames) : null;
  return TOOLS
    .filter(t => !names || names.has(t.name))
    .map(t => ({
      type: 'function',
      function: {
        name:        t.name,
        description: t.description,
        parameters:  t.parameters,
      },
    }));
};

/**
 * Anthropic tools-array format (slight schema difference vs OpenAI).
 */
export const toAnthropicTools = (allowedNames) => {
  const names = allowedNames ? new Set(allowedNames) : null;
  return TOOLS
    .filter(t => !names || names.has(t.name))
    .map(t => ({
      name:         t.name,
      description:  t.description,
      input_schema: t.parameters,
    }));
};

/** Lookup tool spec by name (used by client for card rendering). */
export const getToolSpec = (name) => TOOLS.find(t => t.name === name) || null;
