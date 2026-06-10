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
  {
    name: 'industry_contact.find',
    description: 'Search the user\'s industry contacts by name or role. Use when the user asks to look up a contact.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name or company)' },
        role:  { type: 'string', enum: ['casting_director','producer','agent','manager','scout','other'] },
        limit: { type: 'integer', description: 'Max results' },
      },
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

  // ── Touring (Sprint 9) ───────────────────────────────────────────────────
  {
    name: 'tour.create',
    description: 'Create a new tour. Returns the tour id so subsequent show.create calls can attach to it.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        name:       { type: 'string', description: 'Tour name, e.g. "Summer Run 2026"' },
        start_date: { type: 'string', description: 'ISO date, e.g. 2026-07-01' },
        end_date:   { type: 'string', description: 'ISO date' },
        notes:      { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'show.create',
    description: 'Add a show (hold or confirmed) to the user\'s schedule. Optionally attach to an existing tour.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        venue_name:  { type: 'string' },
        city:        { type: 'string' },
        country:     { type: 'string' },
        show_date:   { type: 'string', description: 'ISO timestamp of the show' },
        status:      { type: 'string', enum: ['hold','confirmed','cancelled','complete'] },
        capacity:    { type: 'integer' },
        gross_offer: { type: 'number', description: 'USD' },
        tour_id:     { type: 'string' },
        notes:       { type: 'string' },
      },
      required: ['venue_name'],
      additionalProperties: false,
    },
  },
  {
    name: 'show.update_status',
    description: 'Confirm, cancel, or complete an existing show.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        show_id: { type: 'string' },
        status:  { type: 'string', enum: ['hold','confirmed','cancelled','complete'] },
      },
      required: ['show_id', 'status'],
      additionalProperties: false,
    },
  },
  {
    name: 'show.add_logistics',
    description: 'Attach or update day-of-show logistics (doors/soundcheck/set time, hotel, transport, contacts) for a show.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        show_id:    { type: 'string' },
        doors_at:   { type: 'string' },
        soundcheck: { type: 'string' },
        set_time:   { type: 'string' },
        hotel:      { type: 'string' },
        transport:  { type: 'string' },
        contacts:   { type: 'object' },
        notes:      { type: 'string' },
      },
      required: ['show_id'],
      additionalProperties: false,
    },
  },

  // ── Catalogue + royalties (Sprint 10) ────────────────────────────────────
  {
    name: 'release.create',
    description: 'Create a music release (single / EP / album / compilation / sync_cue) for the signed-in artist.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        title:        { type: 'string' },
        type:         { type: 'string', enum: ['single','EP','album','compilation','sync_cue'] },
        release_date: { type: 'string', description: 'ISO date' },
        isrc:         { type: 'string', description: 'ISRC code if known' },
        upc:          { type: 'string', description: 'UPC barcode if known' },
        notes:        { type: 'string' },
      },
      required: ['title'],
      additionalProperties: false,
    },
  },
  {
    name: 'track.add',
    description: 'Add a track to an existing release.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        release_id:   { type: 'string', description: 'UUID of the parent release' },
        title:        { type: 'string' },
        duration_sec: { type: 'integer' },
        isrc:         { type: 'string' },
        position:     { type: 'integer', description: 'Track number within the release' },
      },
      required: ['release_id', 'title'],
      additionalProperties: false,
    },
  },
  {
    name: 'split.set',
    description: 'Add a royalty split row to a track. share_bps is in basis points — 5000 = 50%, 10000 = 100%. Multiple calls per track allowed; the sum should equal 10000.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        track_id:   { type: 'string' },
        payee_name: { type: 'string', description: 'Name of payee (writer, composer, producer, label, publisher)' },
        role:       { type: 'string', description: 'Role on the track (writer, composer, producer, performer, publisher, label, sync_owner)' },
        share_bps:  { type: 'integer', description: '0–10000 basis points; 5000 = 50%' },
        notes:      { type: 'string' },
      },
      required: ['track_id', 'payee_name', 'share_bps'],
      additionalProperties: false,
    },
  },
  {
    name: 'statement.parse',
    description: 'Parse a pasted royalty statement text via AI. Extracts line items + computes anomalies vs the user\'s stored royalty_splits. Inserts a royalty_statements row and returns parsed payload + anomalies.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        source:       { type: 'string', enum: ['spotify','apple','youtube','mlc','soundexchange','publisher','sync','distributor','other'] },
        period_start: { type: 'string', description: 'ISO date — start of statement period' },
        period_end:   { type: 'string', description: 'ISO date — end of statement period' },
        raw_text:     { type: 'string', description: 'Paste the entire statement text here. AI extracts structured line items.' },
      },
      required: ['source', 'raw_text'],
      additionalProperties: false,
    },
  },

  // ── EPK (Sprint 11) ──────────────────────────────────────────────────────
  {
    name: 'epk.upsert',
    description: 'Create or update the user\'s electronic press kit (EPK). Slug is unique app-wide; default is derived from display_name. Set public=true to make /epk/:slug publicly viewable.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        slug:          { type: 'string', description: 'URL slug — lowercase, dash-separated. Auto-generated from display_name if omitted.' },
        display_name:  { type: 'string' },
        tagline:       { type: 'string' },
        bio_md:        { type: 'string', description: 'Bio in markdown' },
        hero_image_url:{ type: 'string' },
        reel_mux_id:   { type: 'string', description: 'Mux playback id for the showreel' },
        press_quotes:  { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, source: { type: 'string' } } } },
        contact_email: { type: 'string' },
        public:        { type: 'boolean', description: 'Set true to publish; defaults false.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'epk.publish',
    description: 'Toggle the user\'s EPK to publicly viewable at /epk/:slug.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: { public: { type: 'boolean' } },
      required: ['public'],
      additionalProperties: false,
    },
  },

  // ── Read / query tools (let MO answer "what do I have?") ──────────────────
  {
    name: 'audition.list',
    description: 'List the signed-in user\'s auditions, newest first. Use when the user asks what auditions they have, upcoming reads, or pipeline status.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['submitted','callback','booked','pass','no_response'], description: 'Optional status filter' },
        limit:  { type: 'integer', description: 'Max rows (default 20)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'contract.list',
    description: 'List the user\'s contracts (project, client, type, value, status, expiry). Use when the user asks about active contracts, what\'s expiring, or signed deals.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Optional status filter (e.g. active, signed, expired, draft)' },
        limit:  { type: 'integer' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'commission.list',
    description: 'List the agency\'s commissions (amount due/collected, due date, status). Use for "what commissions are outstanding / overdue".',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Optional status filter (e.g. pending, collected, overdue)' },
        limit:  { type: 'integer' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'roster.list',
    description: 'List talent on the signed-in agency\'s roster. Use for "who is on my roster", "show my talent".',
    mode: 'auto',
    parameters: { type: 'object', properties: { limit: { type: 'integer' } }, additionalProperties: false },
  },
  {
    name: 'tour.list',
    description: 'List the user\'s tours (name, status, dates). Use for "what tours do I have".',
    mode: 'auto',
    parameters: { type: 'object', properties: { limit: { type: 'integer' } }, additionalProperties: false },
  },
  {
    name: 'show.list',
    description: 'List the user\'s shows (venue, city, date, status, offer). Use for "what shows are confirmed", "upcoming gigs", or shows on a specific tour.',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: {
        status:  { type: 'string', enum: ['hold','confirmed','cancelled','complete'] },
        tour_id: { type: 'string', description: 'Optional — only shows on this tour' },
        limit:   { type: 'integer' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'release.list',
    description: 'List the user\'s music releases (title, type, release date, ISRC/UPC). Use for "show my catalogue", "what have I released".',
    mode: 'auto',
    parameters: { type: 'object', properties: { limit: { type: 'integer' } }, additionalProperties: false },
  },
  {
    name: 'income.summary',
    description: 'Summarize the user\'s income records — total + breakdown by source for an optional tax year. Use for "how much did I earn", "income this year".',
    mode: 'auto',
    parameters: {
      type: 'object',
      properties: { tax_year: { type: 'integer', description: 'Optional 4-digit year filter, e.g. 2026' } },
      additionalProperties: false,
    },
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

// OpenAI's function-calling spec requires tool names to match
// `^[a-zA-Z0-9_-]+$`. Our internal tool names use `domain.action` (dot
// separated) for readability. Encode `.` → `__` going OUT to OpenAI and
// decode `__` → `.` coming BACK from tool_calls so the handler lookup +
// every other site in the code keeps using the friendly dotted names.
export const encodeToolNameForOpenAI = (name) => name.replace(/\./g, '__');
export const decodeToolNameFromOpenAI = (name) => name.replace(/__/g, '.');

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
        name:        encodeToolNameForOpenAI(t.name),
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
