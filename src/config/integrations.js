// AI Operator — Tools & Skills catalog (MulBros media + talent + agency scope).
// Adapted from FSZT Remix v2 integrations-data.jsx.
// Status reflects what Sprint 4 / Sprint 5 actually shipped server-side.
//
// status: 'connected' = adapter wired AND env vars present (best-effort default)
//         'available' = adapter wired but env vars not set; user can connect
//         'planned'   = not wired yet (Sprint 7+ backlog)
//
// priority: 'required' = needed for core talent/agency flows

export const TOOL_CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'casting',    label: 'Casting & talent' },
  { id: 'payments',   label: 'Payments & finance' },
  { id: 'video',      label: 'Video & self-tape' },
  { id: 'comms',      label: 'Comms' },
  { id: 'crm',        label: 'CRM & contacts' },
  { id: 'analytics',  label: 'Search & intel' },
  { id: 'social',     label: 'Social & ads' },
  { id: 'ai',         label: 'AI providers' },
  { id: 'ops',        label: 'Ops & data' },
];

export const TOOLS = [
  // ── Casting & talent (Sprint 7+ backlog) ─────────────────────
  { key: 'backstage',     name: 'Backstage',           cat: 'casting',  status: 'planned',   color: '#000000', glyph: 'B',
    blurb: 'Casting call feed for actors, models, voice talent. US/UK breakdowns.', priority: 'required' },
  { key: 'actorsaccess',  name: 'Actors Access',       cat: 'casting',  status: 'planned',   color: '#1F4E79', glyph: 'A',
    blurb: 'Breakdown Services casting feed. Self-tape submissions.' },
  { key: 'castingnetworks', name: 'Casting Networks',  cat: 'casting',  status: 'planned',   color: '#C8102E', glyph: 'C',
    blurb: 'Casting calls + agent submissions + audition tracking.' },
  { key: 'sagaftra',      name: 'SAG-AFTRA',           cat: 'casting',  status: 'planned',   color: '#003B6F', glyph: 'S',
    blurb: 'Union scale awareness, residuals, P&H contributions.' },
  { key: 'imdbpro',       name: 'IMDb Pro',            cat: 'casting',  status: 'planned',   color: '#F5C518', glyph: 'i',
    blurb: 'Credit verification, project tracking, comp analysis.' },

  // ── Payments & finance (Sprint 4 wired) ──────────────────────
  { key: 'stripe',        name: 'Stripe Connect',      cat: 'payments', status: 'available', color: '#635BFF', glyph: 'S',
    blurb: 'Multi-party commission splits + payouts. Onboarding link wired.', priority: 'required' },
  { key: 'plaid',         name: 'Plaid',               cat: 'payments', status: 'available', color: '#0A1F44', glyph: 'P',
    blurb: 'Bank account sync, transactions → income_records auto-categorized.', priority: 'required' },
  { key: 'docusign',      name: 'DocuSign',            cat: 'payments', status: 'available', color: '#FFCC22', glyph: 'D',
    blurb: 'Contract envelope send + Connect webhook on signed/voided.', priority: 'required' },

  // ── Video & self-tape (Sprint 4 wired) ───────────────────────
  { key: 'mux',           name: 'Mux Video',           cat: 'video',    status: 'available', color: '#FB2491', glyph: 'M',
    blurb: 'Direct upload URLs for self-tapes + asset.ready webhook.', priority: 'required' },
  { key: 'vimeo',         name: 'Vimeo',               cat: 'video',    status: 'planned',   color: '#1AB7EA', glyph: 'V',
    blurb: 'Video portfolio hosting + view analytics.' },
  { key: 'youtube',       name: 'YouTube',             cat: 'video',    status: 'planned',   color: '#FF0000', glyph: '▶',
    blurb: 'Channel performance, subscriber growth, retention.' },
  { key: 'spotify',       name: 'Spotify Artist',      cat: 'video',    status: 'available', color: '#1DB954', glyph: 'S',
    blurb: 'OAuth wired — pulls artist stats, top tracks, recently played.' },

  // ── Comms (Sprint 4 + 5 wired) ───────────────────────────────
  { key: 'twilio',        name: 'Twilio SMS',          cat: 'comms',    status: 'available', color: '#F22F46', glyph: 'T',
    blurb: 'Booking + audition reminder SMS. Sprint 4 adapter live.', priority: 'required' },
  { key: 'resend',        name: 'Resend',              cat: 'comms',    status: 'available', color: '#000000', glyph: 'R',
    blurb: 'Transactional email — welcome, notifications, agent comms.' },
  { key: 'gmail',         name: 'Gmail',               cat: 'comms',    status: 'planned',   color: '#EA4335', glyph: '✉',
    blurb: 'Agent inbox triage + thread summary. Comms relay sub-agent.' },
  { key: 'slack',         name: 'Slack',               cat: 'comms',    status: 'planned',   color: '#4A154B', glyph: '#',
    blurb: 'Daily digests + escalations into your team channel.' },
  { key: 'whatsapp',      name: 'WhatsApp Business',   cat: 'comms',    status: 'planned',   color: '#25D366', glyph: 'w',
    blurb: 'High-touch SMS-style outreach for warm leads.' },
  { key: 'gcal',          name: 'Google Calendar',     cat: 'comms',    status: 'planned',   color: '#4285F4', glyph: '◑',
    blurb: 'Sync auditions + bookings + shoot dates.' },

  // ── CRM & contacts ───────────────────────────────────────────
  { key: 'hubspot',       name: 'HubSpot',             cat: 'crm',      status: 'planned',   color: '#FF7A59', glyph: 'H',
    blurb: 'CRM contacts, pipeline, lead sources, sequences.' },
  { key: 'apollo',        name: 'Apollo',              cat: 'crm',      status: 'planned',   color: '#6B4EE6', glyph: 'A',
    blurb: 'Prospect database, intent signals, firmographics.' },
  { key: 'linkedin',      name: 'LinkedIn',            cat: 'crm',      status: 'planned',   color: '#0A66C2', glyph: 'in',
    blurb: 'Industry network outreach + signal listening.' },
  { key: 'industry-cd',   name: 'Industry Contacts',   cat: 'crm',      status: 'connected', color: '#0F6E56', glyph: '◆',
    blurb: 'In-app registry of casting directors, producers, agents, scouts.' },

  // ── Search & intel (Sprint 4 wired) ──────────────────────────
  { key: 'firecrawl',     name: 'Firecrawl',           cat: 'analytics', status: 'available', color: '#FF4F00', glyph: 'F',
    blurb: 'Google-indexed Reddit + web search for industry intel agent.' },
  { key: 'apify',         name: 'Apify Reddit',        cat: 'analytics', status: 'available', color: '#FF9012', glyph: 'A',
    blurb: 'Deep-scrape Reddit (residential proxy). Fallback when Firecrawl quota exhausted.' },
  { key: 'ga',            name: 'Google Analytics',    cat: 'analytics', status: 'planned',   color: '#E37400', glyph: '▲',
    blurb: 'Site traffic, conversions, attribution paths.' },

  // ── Social & ads (Sprint 7+) ─────────────────────────────────
  { key: 'instagram',     name: 'Instagram',           cat: 'social',   status: 'planned',   color: '#E4405F', glyph: '◉',
    blurb: 'DM triage, content listening, lead capture.' },
  { key: 'tiktok',        name: 'TikTok',              cat: 'social',   status: 'planned',   color: '#000000', glyph: 'd',
    blurb: 'Short-form video performance + creator audience.' },
  { key: 'meta-ads',      name: 'Meta Ads',            cat: 'social',   status: 'planned',   color: '#1877F2', glyph: '∞',
    blurb: 'Campaign spend, impressions, conversions, ROAS.' },
  { key: 'tiktok-ads',    name: 'TikTok Ads',          cat: 'social',   status: 'planned',   color: '#0B0B0B', glyph: 't',
    blurb: 'Paid talent acquisition campaigns + CTA optimization.' },

  // ── AI providers (Sprint 0+ wired) ───────────────────────────
  { key: 'openai',        name: 'OpenAI',              cat: 'ai',       status: 'available', color: '#10A37F', glyph: 'O',
    blurb: 'gpt-4o, gpt-4o-mini, Responses API web search. Primary AI provider.', priority: 'required' },
  { key: 'anthropic',     name: 'Anthropic Claude',    cat: 'ai',       status: 'available', color: '#D97757', glyph: 'C',
    blurb: 'claude-opus-4-5, sonnet-4-5, haiku-4-5. Long-context + reasoning.' },
  { key: 'sentry',        name: 'Sentry',              cat: 'ai',       status: 'available', color: '#362D59', glyph: 'S',
    blurb: 'Error tracking + 5xx forwarding for both React + Express.' },

  // ── Ops & data ───────────────────────────────────────────────
  { key: 'supabase',      name: 'Supabase',            cat: 'ops',      status: 'connected', color: '#3ECF8E', glyph: 'sb',
    blurb: 'Postgres + auth + storage + RLS. Core data platform.', priority: 'required' },
  { key: 'stytch',        name: 'Stytch',              cat: 'ops',      status: 'connected', color: '#7C3AED', glyph: 'S',
    blurb: 'Email/password + SMS OTP auth. JWT bridge to Supabase RLS.', priority: 'required' },
  { key: 'notion',        name: 'Notion',              cat: 'ops',      status: 'planned',   color: '#0B0B0B', glyph: 'N',
    blurb: 'Internal SOPs, brand guidelines, knowledge base.' },
  { key: 'zapier',        name: 'Zapier',              cat: 'ops',      status: 'planned',   color: '#FF4F00', glyph: 'Z',
    blurb: 'Bridge to long-tail SaaS not natively supported.' },
];

// ── Skill catalog — maps 14 Talent + Agency sub-agents → required tools ──
// Five groups, color-coded.
export const SKILL_CATALOG = [
  { id: 'talent-front',  name: 'Talent — front office',   color: '#0F6E56', tint: '#E6F1EC',
    skills: [
      { id: 'audition-tracker',  name: 'Audition tracker',     agent: 'TA-01', tools: ['industry-cd','gcal'] },
      { id: 'self-tape-coach',   name: 'Self-tape coach',      agent: 'TA-02', tools: ['mux'] },
      { id: 'agent-intermediary',name: 'Agent intermediary',   agent: 'TA-03', tools: ['gmail','resend'] },
      { id: 'industry-intel',    name: 'Industry intel',       agent: 'TA-04', tools: ['firecrawl','apify','openai'] },
      { id: 'contract-reader',   name: 'Contract reader',      agent: 'TA-05', tools: ['openai','docusign'] },
    ]},
  { id: 'talent-back',   name: 'Talent — back office',    color: '#2B6CDF', tint: '#E5EDFB',
    skills: [
      { id: 'income-tax',        name: 'Income & tax',         agent: 'TB-01', tools: ['plaid','stripe'] },
      { id: 'talent-marketing',  name: 'Talent marketing',     agent: 'TB-02', tools: ['instagram','tiktok','spotify'] },
    ]},
  { id: 'agency-front',  name: 'Agency — talent ops',     color: '#D85A30', tint: '#FBE9E1',
    skills: [
      { id: 'roster-manager',    name: 'Roster manager',       agent: 'AG-01', tools: ['industry-cd','supabase'] },
      { id: 'opportunity-scout', name: 'Opportunity scout',    agent: 'AG-02', tools: ['backstage','actorsaccess','castingnetworks','firecrawl'] },
      { id: 'submission-drafter',name: 'Submission drafter',   agent: 'AG-03', tools: ['openai','resend','gmail'] },
      { id: 'contract-negotiator',name:'Contract negotiator',  agent: 'AG-04', tools: ['openai','docusign'] },
    ]},
  { id: 'agency-back',   name: 'Agency — finance + comms',color: '#7C5CD9', tint: '#F1ECFB',
    skills: [
      { id: 'commission-tracker',name: 'Commission tracker',   agent: 'AB-01', tools: ['stripe','plaid'] },
      { id: 'comms-relay',       name: 'Comms relay',          agent: 'AB-02', tools: ['gmail','slack','twilio','whatsapp'] },
      { id: 'agency-admin',      name: 'Agency admin',         agent: 'AB-03', tools: ['supabase'] },
    ]},
  { id: 'platform',     name: 'Platform & ops',           color: '#0B1D3A', tint: '#E5E8EF',
    skills: [
      { id: 'cost-ledger',       name: 'Cost ledger',          agent: 'PL-01', tools: ['supabase','openai','anthropic'] },
      { id: 'observability',     name: 'Observability',        agent: 'PL-02', tools: ['sentry','supabase'] },
    ]},
];
