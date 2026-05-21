import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { Resend } from 'resend';
import * as stytch from 'stytch';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';
import crypto from 'crypto';

// ── Sentry init — must run before Express creates handlers ────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn:         process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release:     process.env.APP_VERSION || 'dev',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Scrub auth headers from outbound events
      if (event.request?.headers) {
        const h = event.request.headers;
        delete h.Authorization;
        delete h.authorization;
        delete h['x-stytch-session-jwt'];
        delete h['x-stytch-session-token'];
        delete h.cookie;
      }
      return event;
    },
  });
  console.log('[Sentry] initialized — server-side error tracking active');
} else {
  console.warn('[Sentry] DSN not set — server-side error tracking disabled');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

// ── Trust Render's reverse proxy so rate-limiting sees real client IPs ────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],   // Vite needs inline scripts
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      connectSrc:  [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.stytch.com',
        'https://test.stytch.com',
        'https://api.spotify.com',
        'https://accounts.spotify.com',
      ],
      imgSrc:      ["'self'", 'data:', 'https://i.scdn.co', 'https://mosaic.scdn.co'],
    },
  },
}));
app.disable('x-powered-by');

// ── HTTP Basic Auth (stopgap until proper auth is added) ──────────────────────
// Set ADMIN_USER and ADMIN_PASS on Render environment variables
if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
  app.use(basicAuth({
    users:          { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
    challenge:      true,
    realm:          'MulBros Media OS',
  }));
}

app.use(express.json({ limit: '512kb' }));   // tighter than 2MB for AI proxy

// ── Stytch session verification middleware ───────────────────────────────────
// Protects endpoints that spend paid quota (/api/email, /api/firecrawl-search,
// /api/apify-reddit). Requires STYTCH_PROJECT_ID + STYTCH_SECRET in env.
// Fails closed: if env vars missing, rejects all requests with 503 rather than
// silently accepting anonymous traffic.
const stytchClient = (process.env.STYTCH_PROJECT_ID && process.env.STYTCH_SECRET)
  ? new stytch.Client({
      project_id: process.env.STYTCH_PROJECT_ID,
      secret:     process.env.STYTCH_SECRET,
      env:        process.env.STYTCH_ENV === 'live' ? stytch.envs.live : stytch.envs.test,
    })
  : null;

const isProduction = process.env.NODE_ENV === 'production';

const requireAuth = async (req, res, next) => {
  // Dev fallback: if Stytch backend creds not configured, allow through with a
  // synthetic user so local/dev testing works. Production still fails closed.
  if (!stytchClient) {
    if (isProduction) {
      return res.status(503).json({
        error: { message: 'Auth not configured on server (STYTCH_PROJECT_ID / STYTCH_SECRET missing).' },
      });
    }
    console.warn('[requireAuth] Stytch backend not configured — allowing request in non-production mode.');
    req.stytchUser = { userId: 'dev-unauthenticated', sessionId: 'dev' };
    return next();
  }
  // Prefer header; fall back to Stytch cookies (set non-httpOnly by default).
  const cookieHeader = (req.headers.cookie || '').toString();
  const cookieMatch = (name) => {
    const m = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : '';
  };
  let source = null;
  let token = '';
  if ((req.headers['x-stytch-session-jwt'] || '').toString().trim())  { source = 'header-jwt';   token = req.headers['x-stytch-session-jwt'].toString().trim(); }
  else if ((req.headers['x-stytch-session-token'] || '').toString().trim()) { source = 'header-token'; token = req.headers['x-stytch-session-token'].toString().trim(); }
  else if (cookieMatch('stytch_session_jwt'))                         { source = 'cookie-jwt';   token = cookieMatch('stytch_session_jwt'); }
  else if (cookieMatch('stytch_session'))                             { source = 'cookie-token'; token = cookieMatch('stytch_session'); }

  if (!token) {
    console.warn('[requireAuth] No token found. cookie keys:', cookieHeader.split(';').map(p => p.trim().split('=')[0]).filter(Boolean).join(','));
    return res.status(401).json({ error: { message: 'Missing session token.' } });
  }
  console.info('[requireAuth] source=%s len=%d', source, token.length);
  try {
    const result = token.split('.').length === 3
      ? await stytchClient.sessions.authenticateJwt({ session_jwt: token })
      : await stytchClient.sessions.authenticate({ session_token: token });
    req.stytchUser = {
      userId:    result.session?.user_id || result.user?.user_id,
      sessionId: result.session?.session_id,
    };
    if (!req.stytchUser.userId) {
      return res.status(401).json({ error: { message: 'Invalid session.' } });
    }
    return next();
  } catch (err) {
    console.error('Stytch auth failed:', err.message || err);
    return res.status(401).json({ error: { message: 'Invalid or expired session.' } });
  }
};

// ── Service-role JWT minter (HS256) ─────────────────────────────────────────
// Used by server for internal Supabase REST calls that need to bypass RLS
// (profile lookup before user session exists, role gate, auto-create flows).
// Short-lived (10 min) so a leaked token expires fast.
const mintServiceJwt = () => {
  if (!process.env.SUPABASE_JWT_SECRET) return null;
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { aud: 'authenticated', role: 'service_role', iss: 'mulbros-bridge-svc', iat: now, exp: now + 600 },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' },
  );
};

// ── Cost ledger helper ────────────────────────────────────────────────────────
// Logs per-request spend to cost_ledger table. Fire-and-forget — never blocks
// the user response. Uses service JWT to write across RLS.
const PROVIDER_PRICING = {
  // USD per 1K tokens (May 2026 approximations — update as providers change rates)
  'gpt-4o':         { in: 0.0025, out: 0.01 },
  'gpt-4o-mini':    { in: 0.00015, out: 0.0006 },
  'claude-opus-4-5':    { in: 0.015, out: 0.075 },
  'claude-sonnet-4-5':  { in: 0.003, out: 0.015 },
  'claude-haiku-4-5':   { in: 0.0008, out: 0.004 },
};

const estimateAiCost = (model, tokensIn = 0, tokensOut = 0) => {
  const p = PROVIDER_PRICING[model];
  if (!p) return 0;
  return ((tokensIn / 1000) * p.in) + ((tokensOut / 1000) * p.out);
};

const logCostFireAndForget = async ({ userId, endpoint, provider, model, tokens_in = 0, tokens_out = 0, usd_cost = 0, metadata = {} }) => {
  if (!process.env.SUPABASE_JWT_SECRET) return;
  try {
    const svcJwt = mintServiceJwt();
    if (!svcJwt) return;
    await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/cost_ledger`, {
      method: 'POST',
      headers: {
        apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${svcJwt}`,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify({
        user_id:    userId || null,
        endpoint,
        provider,
        model:      model || null,
        tokens_in,
        tokens_out,
        usd_cost,
        metadata,
      }),
    });
  } catch (err) {
    // Never let cost-logging crash a real request — Sentry it
    if (process.env.SENTRY_DSN) {
      try { Sentry.captureException(err, { tags: { component: 'cost_ledger' } }); } catch { /* noop */ }
    }
    console.warn('[cost_ledger] log failed:', err.message);
  }
};

// Cache stytch_user_id → profile.id so cost logging doesn't hit Supabase every request.
const stytchToProfileCache = new Map();
const resolveProfileIdFromStytch = async (stytchUid) => {
  if (!stytchUid) return null;
  if (stytchToProfileCache.has(stytchUid)) return stytchToProfileCache.get(stytchUid);
  if (!process.env.SUPABASE_JWT_SECRET || !process.env.VITE_SUPABASE_URL) return null;
  try {
    const svcJwt = mintServiceJwt();
    if (!svcJwt) return null;
    const r = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?stytch_user_id=eq.${encodeURIComponent(stytchUid)}&select=id`,
      { headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${svcJwt}` } },
    );
    const rows = await r.json();
    const pid = rows[0]?.id || null;
    if (pid) stytchToProfileCache.set(stytchUid, pid);
    return pid;
  } catch {
    return null;
  }
};

// ── Role-gate middleware ──────────────────────────────────────────────────────
// Uses user_roles table (Supabase REST) keyed by profile.id (stytch_user_id → profile).
// Requires requireAuth upstream. Allows request if user's role is in `allowed`.
// Uses service-role JWT (not anon key) so RLS doesn't block the lookup.
const requireRole = (allowed) => async (req, res, next) => {
  try {
    const stytchUid = req.stytchUser?.userId;
    if (!stytchUid) return res.status(401).json({ error: { code: 'unauthorized', message: 'Auth required.' } });
    const svcJwt = mintServiceJwt();
    if (!svcJwt) {
      console.error('requireRole: SUPABASE_JWT_SECRET missing — cannot mint service JWT.');
      return res.status(503).json({ error: { code: 'role_check_unavailable', message: 'Role check unavailable.' } });
    }
    const sbHeaders = {
      apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${svcJwt}`,
    };
    const pr = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?stytch_user_id=eq.${encodeURIComponent(stytchUid)}&select=id`,
      { headers: sbHeaders },
    );
    const profiles = await pr.json();
    const profileId = profiles[0]?.id;
    if (!profileId) return res.status(403).json({ error: { code: 'forbidden', message: 'No profile.' } });

    const rr = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${profileId}&select=role`,
      { headers: sbHeaders },
    );
    const rows = await rr.json();
    const role = rows[0]?.role || 'member';
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: { code: 'forbidden', message: `Requires role: ${allowed.join(' / ')}` } });
    }
    req.userRole = role;
    req.profileId = profileId;
    next();
  } catch (err) {
    console.error('requireRole error:', err.message);
    res.status(500).json({ error: { code: 'role_check_failed', message: 'Could not verify role.' } });
  }
};
// Exported-equivalent — usage: app.post('/api/admin/x', requireAuth, requireRole(['admin']), handler)
// eslint-disable-next-line no-unused-vars
const _requireRoleExport = requireRole; // silence unused warning if not yet applied to routes

// ── Per-user rate limiter (in-memory; fine for single-instance Render) ────────
// Keyed by Stytch user_id — supplements global express-rate-limit which is IP-based.
const perUserWindows = new Map();
const perUserLimit = ({ windowMs, max, message }) => (req, res, next) => {
  const uid = req.stytchUser?.userId;
  if (!uid) return next(); // requireAuth already ran; trust it
  const now = Date.now();
  const entry = perUserWindows.get(uid);
  if (!entry || now - entry.windowStart > windowMs) {
    perUserWindows.set(uid, { windowStart: now, count: 1 });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({ error: { message } });
  }
  entry.count += 1;
  return next();
};

// ── Rate limiter ──────────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: { message: 'Too many AI requests — please wait a minute.' } },
});

// ── Allowed models ─────────────────────────────────────────────────────────────
const ALLOWED_MODELS = new Set([
  // OpenAI
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-search-preview',      // built-in web search
  // Anthropic — confirmed valid model IDs only
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-5-haiku-20241022',
]);

// ── Stytch → Supabase JWT bridge ──────────────────────────────────────────────
// Mints a Supabase-compatible JWT (HS256, signed with project JWT secret) so
// authenticated Supabase queries get role=authenticated and auth.uid()=profile.id.
// This enables RLS policies of the form `user_id = auth.uid()` to work.
// `mintServiceJwt` is defined above (used by requireRole + this endpoint).

app.post('/api/auth/supabase-token', requireAuth, async (req, res) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    return res.status(503).json({ error: { message: 'SUPABASE_JWT_SECRET not configured.' } });
  }
  try {
    const stytchUid = req.stytchUser?.userId;
    if (!stytchUid) return res.status(401).json({ error: { message: 'No Stytch user.' } });

    // Look up Supabase profile.id (uuid) by stytch_user_id — uses service_role JWT
    // to bypass RLS (chicken-egg: profile lookup happens BEFORE user has session).
    const svcJwt = mintServiceJwt();
    const sbHeaders = {
      apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${svcJwt}`,
    };
    const pr = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?stytch_user_id=eq.${encodeURIComponent(stytchUid)}&select=id,email`,
      { headers: sbHeaders },
    );
    const profilesArr = await pr.json();
    let profile = profilesArr[0];

    // First login — auto-create profile via service_role
    if (!profile?.id) {
      const email = req.body?.email || null;
      const cr = await fetch(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles`,
        {
          method:  'POST',
          headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body:    JSON.stringify({
            stytch_user_id:      stytchUid,
            email,
            onboarding_complete: false,
          }),
        },
      );
      if (!cr.ok) {
        const txt = await cr.text();
        console.error('profile auto-create failed:', cr.status, txt);
        return res.status(500).json({ error: { message: 'Profile create failed.' } });
      }
      const created = await cr.json();
      profile = Array.isArray(created) ? created[0] : created;
    }
    if (!profile?.id) return res.status(500).json({ error: { message: 'Profile resolution failed.' } });

    // Mint Supabase JWT — sub=profile.id, role=authenticated, exp=1h
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      {
        aud:   'authenticated',
        role:  'authenticated',
        sub:   profile.id,
        email: profile.email || undefined,
        iss:   'mulbros-bridge',
        iat:   now,
        exp:   now + 3600,
      },
      process.env.SUPABASE_JWT_SECRET,
      { algorithm: 'HS256' },
    );

    // refresh_token is opaque to Supabase HS256 path — reuse access_token; client
    // will re-fetch via this endpoint when it nears expiry.
    return res.json({
      access_token:  accessToken,
      refresh_token: accessToken,
      token_type:    'bearer',
      expires_in:    3600,
      profile,
    });
  } catch (err) {
    console.error('supabase-token mint failed:', err.message || err);
    return res.status(500).json({ error: { message: 'Token mint failed.' } });
  }
});

// ── AI proxy ──────────────────────────────────────────────────────────────────
app.post('/api/ai', aiLimiter, async (req, res) => {
  const { model, messages, max_tokens } = req.body || {};

  // Request body validation
  if (!model || !ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: { message: `Model not allowed. Use: ${[...ALLOWED_MODELS].join(', ')}` } });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages must be a non-empty array.' } });
  }

  // Enforce max_tokens cap server-side
  const safeMaxTokens = Math.min(Number(max_tokens) || 2048, 4096);

  const isAnthropic = model.startsWith('claude-');

  // Use provider-specific env var first — never let an OpenAI key reach Anthropic or vice versa
  const serverKey = isAnthropic
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY;
  const clientKey = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const apiKeyVal = serverKey || clientKey;

  if (!apiKeyVal) {
    return res.status(401).json({ error: { message: 'No API key provided. Add your key in Settings → API Keys.' } });
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  try {
    let apiUrl, body, headers;

    if (isAnthropic) {
      // Anthropic Messages API format
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMsgs  = messages.filter(m => m.role !== 'system');
      apiUrl  = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type':      'application/json',
        'x-api-key':         apiKeyVal,
        'anthropic-version': '2023-06-01',
      };
      body = {
        model,
        max_tokens: safeMaxTokens,
        ...(systemMsg && { system: systemMsg.content }),
        messages: chatMsgs,
      };
    } else {
      // OpenAI Chat Completions format
      apiUrl  = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKeyVal}`,
      };
      body = { model, messages, max_tokens: safeMaxTokens };
    }

    const response = await fetch(apiUrl, {
      method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal,
    });
    const data = await response.json();

    // Wrap non-OK upstream responses: log details server-side, return generic message
    if (!response.ok) {
      console.error('AI proxy upstream error:', response.status, JSON.stringify(data).slice(0, 500));
      const userFacing = response.status === 401 ? 'AI provider authentication failed.'
        : response.status === 429 ? 'AI provider rate-limited. Try again in a minute.'
        : response.status >= 500 ? 'AI provider unavailable. Try again shortly.'
        : `AI request failed (${response.status}).`;
      return res.status(response.status).json({ error: { code: 'ai_upstream', message: userFacing } });
    }

    // Parse token usage for cost ledger (fire-and-forget)
    const tokensIn  = isAnthropic ? (data.usage?.input_tokens  || 0) : (data.usage?.prompt_tokens     || 0);
    const tokensOut = isAnthropic ? (data.usage?.output_tokens || 0) : (data.usage?.completion_tokens || 0);
    const usdCost   = estimateAiCost(model, tokensIn, tokensOut);
    resolveProfileIdFromStytch(req.stytchUser?.userId).then(profileId => {
      logCostFireAndForget({
        userId:   profileId,
        endpoint: '/api/ai',
        provider: isAnthropic ? 'anthropic' : 'openai',
        model,
        tokens_in:  tokensIn,
        tokens_out: tokensOut,
        usd_cost:   usdCost,
      });
    });

    // Normalize Anthropic response to OpenAI shape so the client doesn't need to change
    if (isAnthropic && data.content) {
      return res.status(response.status).json({
        choices: [{ message: { role: 'assistant', content: data.content[0]?.text || '' } }],
      });
    }

    res.status(response.status).json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Request timed out after 30 seconds. Try a shorter prompt.' } });
    } else {
      // Don't leak internal error messages
      console.error('AI proxy error:', err.message);
      res.status(500).json({ error: { message: 'Internal server error. Please try again.' } });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── OpenAI web-search proxy (Responses API) ──────────────────────────────────
// Uses the built-in `web_search_preview` tool. Model decides whether to search.
// Returns { text, citations[], raw }. Used as fallback when Firecrawl is down.
app.post('/api/ai-search', aiLimiter, async (req, res) => {
  const { model = 'gpt-4o', input, system } = req.body || {};

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({ error: { message: 'input must be a non-empty string.' } });
  }
  if (!['gpt-4o', 'gpt-4o-mini'].includes(model)) {
    return res.status(400).json({ error: { message: 'model must be gpt-4o or gpt-4o-mini.' } });
  }

  const serverKey = process.env.OPENAI_API_KEY;
  const clientKey = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const apiKeyVal = serverKey || clientKey;
  if (!apiKeyVal) {
    return res.status(401).json({ error: { message: 'No OpenAI key configured.' } });
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 60_000);

  try {
    const forceSearch = req.body?.forceSearch !== false;  // default: force (user explicitly picked web mode)
    const today       = new Date().toISOString().slice(0, 10);
    const guard = `Today is ${today}. RULES: (1) Stay in character as defined above — never identify as "SearchGPT", "an AI assistant", or any other persona. (2) You MUST call the web_search tool for this query. Do not claim you searched if you did not. (3) Only cite URLs the tool actually returned. Never fabricate URLs, usernames, or post details. (4) If the tool returns nothing useful, state exactly that — do not list generic resources as a substitute.`;
    const r = await fetch('https://api.openai.com/v1/responses', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKeyVal}` },
      body:    JSON.stringify({
        model,
        tools: [{
          type: 'web_search_preview',
          search_context_size: 'high',   // deeper result set — beats default 'medium' on niche queries
        }],
        ...(forceSearch ? { tool_choice: { type: 'web_search_preview' } } : { tool_choice: 'auto' }),
        instructions: system ? `${system}\n\n${guard}` : guard,
        input,
      }),
      signal: controller.signal,
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('AI-search upstream error:', r.status, JSON.stringify(data).slice(0, 500));
      const userFacing = r.status === 401 ? 'AI provider authentication failed.'
        : r.status === 429 ? 'AI provider rate-limited. Try again in a minute.'
        : r.status >= 500 ? 'AI provider unavailable. Try again shortly.'
        : `AI search request failed (${r.status}).`;
      return res.status(r.status).json({ error: { code: 'ai_search_upstream', message: userFacing } });
    }

    const outputs     = Array.isArray(data.output) ? data.output : [];
    const contentArr  = outputs.flatMap(o => Array.isArray(o.content) ? o.content : []);
    const text        = contentArr.filter(c => c.type === 'output_text').map(c => c.text).join('\n');
    const citations   = contentArr
      .flatMap(c => Array.isArray(c.annotations) ? c.annotations : [])
      .filter(a => a.type === 'url_citation')
      .map(a => ({ url: a.url, title: a.title || a.url, start: a.start_index, end: a.end_index }));

    // Cost ledger (fire-and-forget)
    const tokensIn  = data.usage?.input_tokens  || 0;
    const tokensOut = data.usage?.output_tokens || 0;
    const usdCost   = estimateAiCost(model, tokensIn, tokensOut);
    resolveProfileIdFromStytch(req.stytchUser?.userId).then(profileId => {
      logCostFireAndForget({
        userId:   profileId,
        endpoint: '/api/ai-search',
        provider: 'openai',
        model,
        tokens_in:  tokensIn,
        tokens_out: tokensOut,
        usd_cost:   usdCost,
        metadata:   { tool: 'web_search_preview' },
      });
    });

    res.json({ text, citations, source: 'openai-web-search' });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Web search timed out. Try a simpler query.' } });
    } else {
      console.error('AI search proxy error:', err.message);
      res.status(500).json({ error: { message: 'Web search failed. Try again.' } });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── Spotify OAuth (musician vertical) ─────────────────────────────────────────
// Three routes:
//   GET /api/spotify/auth?profile_id=…   → 302 to Spotify authorize
//   GET /api/spotify/callback            → exchange code, upsert tokens, redirect to app
//   GET /api/spotify/artist-stats?profile_id=…  → live fetch with auto-refresh
//
// NOTE on CSRF: state currently carries profile_id directly. Harden later by
// pairing with a signed HttpOnly cookie nonce. Acceptable for MVP behind Stytch.

const SPOTIFY_SCOPES = 'user-read-private user-top-read user-read-recently-played';

const supaHeaders = () => ({
  apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
  Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
  'Content-Type': 'application/json',
});
const supaUrl = (path) => `${process.env.VITE_SUPABASE_URL}/rest/v1/${path}`;

const spotifyUpsertTokens = async ({ profileId, access, refresh, expiresInSec, scope }) => {
  const expires_at = new Date(Date.now() + Math.max(0, (expiresInSec || 3600) - 60) * 1000).toISOString();
  const row = {
    user_id: profileId,
    service: 'spotify',
    access_token: access,
    refresh_token: refresh || null,
    expires_at,
    metadata: { scope: scope || SPOTIFY_SCOPES, updated_at: new Date().toISOString() },
  };
  const r = await fetch(supaUrl('user_integrations?on_conflict=user_id,service'), {
    method: 'POST',
    headers: { ...supaHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Supabase upsert failed: ${r.status} ${text.slice(0, 200)}`);
  }
  return (await r.json())[0];
};

const spotifyReadTokens = async (profileId) => {
  const r = await fetch(
    supaUrl(`user_integrations?user_id=eq.${profileId}&service=eq.spotify&select=*`),
    { headers: supaHeaders() },
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
};

const spotifyRefreshIfNeeded = async (row) => {
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 30_000) return row.access_token;
  if (!row.refresh_token) throw new Error('No refresh token on file; user must reconnect.');

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify client credentials not configured.');

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: row.refresh_token }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || `Spotify refresh failed ${r.status}`);

  await spotifyUpsertTokens({
    profileId:    row.user_id,
    access:       data.access_token,
    refresh:      data.refresh_token || row.refresh_token, // Spotify may omit
    expiresInSec: data.expires_in,
    scope:        data.scope,
  });
  return data.access_token;
};

app.get('/api/spotify/auth', (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirect = process.env.SPOTIFY_REDIRECT_URI;
  const profileId = String(req.query.profile_id || '').trim();
  if (!clientId || !redirect) return res.status(503).send('Spotify not configured.');
  if (!profileId) return res.status(400).send('profile_id required.');

  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    scope:         SPOTIFY_SCOPES,
    redirect_uri:  redirect,
    state:         profileId,
    show_dialog:   'true',
  });
  res.redirect(authUrl);
});

app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const appUrl  = process.env.VITE_APP_URL || 'http://localhost:5173';
  const backTo  = `${appUrl}/vertical/musician`;
  if (error) return res.redirect(`${backTo}?spotify=denied`);
  if (!code || !state) return res.redirect(`${backTo}?spotify=missing_params`);

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect     = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirect) {
    return res.redirect(`${backTo}?spotify=server_unconfigured`);
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code:         String(code),
        redirect_uri: redirect,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Spotify exchange failed', data);
      return res.redirect(`${backTo}?spotify=exchange_failed`);
    }

    await spotifyUpsertTokens({
      profileId:    String(state),
      access:       data.access_token,
      refresh:      data.refresh_token,
      expiresInSec: data.expires_in,
      scope:        data.scope,
    });
    return res.redirect(`${backTo}?spotify=connected`);
  } catch (err) {
    console.error('Spotify callback error', err.message);
    return res.redirect(`${backTo}?spotify=error`);
  }
});

app.get('/api/spotify/artist-stats', async (req, res) => {
  const profileId = String(req.query.profile_id || '').trim();
  if (!profileId) return res.status(400).json({ error: { message: 'profile_id required' } });

  try {
    const row = await spotifyReadTokens(profileId);
    if (!row) return res.status(404).json({ error: { message: 'Spotify not connected' } });

    const accessToken = await spotifyRefreshIfNeeded(row);
    const auth = { Authorization: `Bearer ${accessToken}` };

    const [meR, topR, recentR] = await Promise.all([
      fetch('https://api.spotify.com/v1/me',                                     { headers: auth }),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term', { headers: auth }),
      fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5',      { headers: auth }),
    ]);
    const [me, top, recent] = await Promise.all([meR.json(), topR.json(), recentR.json()]);

    res.json({
      profile: {
        id:           me.id,
        display_name: me.display_name,
        followers:    me.followers?.total ?? null,
        country:      me.country,
        product:      me.product,
        external_url: me.external_urls?.spotify,
        image:        me.images?.[0]?.url || null,
      },
      top_tracks: (top.items || []).map(t => ({
        name:    t.name,
        artists: (t.artists || []).map(a => a.name).join(', '),
        url:     t.external_urls?.spotify,
        album:   t.album?.name,
        image:   t.album?.images?.[0]?.url || null,
      })),
      recently_played: (recent.items || []).map(r => ({
        name:    r.track?.name,
        artists: (r.track?.artists || []).map(a => a.name).join(', '),
        url:     r.track?.external_urls?.spotify,
        played_at: r.played_at,
      })),
      connected_at: row.created_at,
    });
  } catch (err) {
    console.error('Spotify artist-stats error', err.message);
    res.status(500).json({ error: { message: err.message || 'Failed to fetch Spotify stats' } });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ── Weather proxy — avoids CSP connectSrc restriction on wttr.in ──────────────
// Browser fetches /api/weather (same-origin → allowed), server fetches wttr.in
const weatherLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.get('/api/weather', weatherLimiter, async (req, res) => {
  const city = 'Los+Angeles,California';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const upstream = await fetch(`https://wttr.in/${city}?format=j1`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MulBrosMediaOS/2.0 (weather-proxy)' },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Weather upstream error' });
    }
    const data = await upstream.json();
    // Cache 10 minutes client-side — weather doesn't need per-request freshness
    res.set('Cache-Control', 'public, max-age=600');
    res.json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Weather request timed out' });
    } else {
      console.error('Weather proxy error:', err.message);
      res.status(500).json({ error: 'Failed to fetch weather' });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── Reddit search proxy ───────────────────────────────────────────────────────
// Uses Reddit's public JSON API (no API key required). Fetches real posts from
// film-related subreddits and returns them as structured data for the AI to process.
const redditLimiter = rateLimit({
  windowMs: 60_000,
  max:      15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: { message: 'Too many Reddit search requests — please wait a minute.' } },
});

app.post('/api/reddit-search', redditLimiter, async (req, res) => {
  const { query, subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], timeframe = 'year', limit = 15 } = req.body || {};

  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: { message: 'query must be a non-empty string.' } });
  }

  // Build the subreddit filter for Reddit's search syntax
  const subredditFilter = subreddits.map(s => `subreddit:${s}`).join(' OR ');
  const searchQuery     = `(${subredditFilter}) ${query.trim()}`;

  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&t=${timeframe}&limit=${Math.min(Number(limit) || 15, 25)}&type=link`;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal:  controller.signal,
      headers: {
        'User-Agent': 'MulBrosMediaOS/2.0 (research-tool; contact: support@mulbros.com)',
        'Accept':     'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: { message: `Reddit returned ${response.status}` } });
    }

    const data  = await response.json();
    const posts = (data?.data?.children || []).map(({ data: p }) => ({
      id:          p.id,
      subreddit:   p.subreddit,
      author:      p.author,
      title:       p.title,
      content:     (p.selftext || '').slice(0, 1200),   // cap to avoid token bloat
      url:         `https://www.reddit.com${p.permalink}`,
      score:       p.score,
      numComments: p.num_comments,
      created:     new Date(p.created_utc * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      }),
    }));

    res.json({ posts, query: query.trim(), count: posts.length });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Reddit search timed out.' } });
    } else {
      console.error('Reddit search proxy error:', err.message);
      res.status(500).json({ error: { message: 'Reddit search failed. Try again.' } });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── Firecrawl search proxy ────────────────────────────────────────────────────
// Uses Google's indexing of Reddit — far better results than Reddit's own search API.
const firecrawlLimiter = rateLimit({
  windowMs:        60_000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: { message: 'Too many search requests — please wait a minute.' } },
});

const firecrawlPerUser = perUserLimit({
  windowMs: 60 * 60_000, max: 60,
  message: 'You have exceeded your hourly search quota. Try again later.',
});
app.post('/api/firecrawl-search', requireAuth, firecrawlPerUser, firecrawlLimiter, async (req, res) => {
  const { query, subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], limit = 10 } = req.body || {};

  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: { message: 'query must be a non-empty string.' } });
  }

  const apiKey = process.env.Personal_Free_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: { message: 'Firecrawl not configured (FIRECRAWL_API_KEY missing).' } });
  }

  // Build site:reddit.com Google search query scoped to relevant subreddits
  const subredditFilter = subreddits.map(s => `site:reddit.com/r/${s}`).join(' OR ');
  const searchQuery = `(${subredditFilter}) ${query.trim()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query:  searchQuery,
        limit:  Math.min(Number(limit) || 10, 15),
        scrapeOptions: { formats: ['markdown'] },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Firecrawl upstream error:', response.status, JSON.stringify(err).slice(0, 500));
      const userFacing = response.status === 401 ? 'Search authentication failed.'
        : response.status === 402 ? 'Search quota exceeded.'
        : response.status === 429 ? 'Search rate-limited. Try again shortly.'
        : response.status >= 500 ? 'Search provider unavailable.'
        : `Search failed (${response.status}).`;
      return res.status(response.status).json({ error: { code: 'firecrawl_upstream', message: userFacing } });
    }

    const data = await response.json();

    const posts = (data.data || []).map((item) => {
      const urlMatch = item.url?.match(/reddit\.com\/r\/(\w+)/);
      const subreddit = urlMatch ? urlMatch[1] : 'reddit';
      const authorMatch = (item.markdown || '').match(/Posted by u\/(\w+)/i)
                       || (item.description || '').match(/u\/(\w+)/i);
      const author = authorMatch ? authorMatch[1] : 'unknown';
      return {
        subreddit,
        author,
        title:       item.title || '',
        content:     (item.markdown || item.description || '').slice(0, 1200),
        url:         item.url || '',
        score:       null,
        numComments: null,
        created:     item.metadata?.publishedTime
                       ? new Date(item.metadata.publishedTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                       : 'recent',
      };
    });

    // Cost ledger — Firecrawl charges ~$0.005 per search result (May 2026 rate)
    resolveProfileIdFromStytch(req.stytchUser?.userId).then(profileId => {
      logCostFireAndForget({
        userId:   profileId,
        endpoint: '/api/firecrawl-search',
        provider: 'firecrawl',
        usd_cost: posts.length * 0.005,
        metadata: { query: query.trim(), result_count: posts.length },
      });
    });

    res.json({ posts, query: query.trim(), count: posts.length, source: 'firecrawl' });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Firecrawl search timed out.' } });
    } else {
      console.error('Firecrawl proxy error:', err.message);
      res.status(500).json({ error: { message: 'Search failed. Try again.' } });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── Apify Reddit scraper proxy ────────────────────────────────────────────────
// Uses trudax/reddit-scraper-lite by default (override via APIFY_REDDIT_ACTOR).
// Headless browser, ~30–60s. Secondary/fallback path when Firecrawl unavailable.
const apifyLimiter = rateLimit({
  windowMs:        60_000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: { message: 'Too many Apify requests — please wait a minute.' } },
});

const apifyPerUser = perUserLimit({
  windowMs: 60 * 60_000, max: 15,
  message: 'You have exceeded your hourly deep-scrape quota. Try again later.',
});
app.post('/api/apify-reddit', requireAuth, apifyPerUser, apifyLimiter, async (req, res) => {
  const { query, subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], limit = 10 } = req.body || {};

  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: { message: 'query must be a non-empty string.' } });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: { message: 'Apify not configured (APIFY_API_TOKEN missing).' } });
  }

  const slug = process.env.APIFY_REDDIT_ACTOR || 'trudax~reddit-scraper-lite';
  const actorUrl = `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items?token=${token}&timeout=60&memory=512`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70_000);

  const input = {
    searches:          [query.trim()],
    searchPosts:       true,
    searchCommunities: false,
    searchUsers:       false,
    searchComments:    false,
    maxItems:          Math.min(Number(limit) || 10, 20),
    time:              'week',
    sort:              'relevance',
    includeNSFW:       false,
    proxy:             { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
  };
  // Scope to a single subreddit if caller passes exactly one
  if (Array.isArray(subreddits) && subreddits.length === 1) {
    input.searchCommunityName = subreddits[0];
  }

  try {
    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Apify upstream error:', response.status, JSON.stringify(err).slice(0, 500));
      const userFacing = response.status === 401 ? 'Reddit scraper authentication failed.'
        : response.status === 429 ? 'Reddit scraper rate-limited. Try again shortly.'
        : response.status >= 500 ? 'Reddit scraper unavailable.'
        : `Reddit scrape failed (${response.status}).`;
      return res.status(response.status).json({ error: { code: 'apify_upstream', message: userFacing } });
    }

    const items = await response.json();

    const posts = items.map(item => ({
      subreddit:   item.communityName || item.community || item.subreddit || 'reddit',
      author:      item.username      || item.author    || 'unknown',
      title:       item.title         || '',
      content:     (item.body || item.text || '').slice(0, 1200),
      url:         item.url           || `https://reddit.com/r/${item.communityName || item.community}/comments/${item.id}`,
      score:       item.upVotes       || item.score       || 0,
      numComments: item.numberOfComments || item.numComments || 0,
      created:     item.createdAt
                     ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                     : 'recent',
    }));

    // Cost ledger — Apify Reddit scraper ~$0.02 per actor run (residential proxy)
    resolveProfileIdFromStytch(req.stytchUser?.userId).then(profileId => {
      logCostFireAndForget({
        userId:   profileId,
        endpoint: '/api/apify-reddit',
        provider: 'apify',
        usd_cost: 0.02,
        metadata: { query: query.trim(), result_count: posts.length, actor: slug },
      });
    });

    res.json({ posts, query: query.trim(), count: posts.length, source: 'apify' });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Apify scrape timed out (>60s). Try a shorter query.' } });
    } else {
      console.error('Apify proxy error:', err.message);
      res.status(500).json({ error: { message: 'Apify scrape failed. Try again.' } });
    }
  } finally {
    clearTimeout(timeout);
  }
});

// ── Resend email proxy ────────────────────────────────────────────────────────
// Server-side only — API key never reaches the browser bundle.
// Used for transactional emails (welcome, notifications, etc.)
const emailLimiter = rateLimit({
  windowMs:        60_000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: { message: 'Too many email requests — please wait a minute.' } },
});

// Validation helpers — reject header injection (CRLF) and enforce length caps.
const EMAIL_RE = /^[^\s@<>"',;:\\]+@[^\s@<>"',;:\\]+\.[^\s@<>"',;:\\]+$/;
const hasCRLF  = (s) => typeof s === 'string' && /[\r\n]/.test(s);
const EMAIL_LIMITS = { subject: 200, html: 200_000, text: 50_000, recipients: 10 };

const emailPerUser = perUserLimit({
  windowMs: 60 * 60_000, max: 30,
  message: 'You have exceeded your hourly email quota.',
});

app.post('/api/email', requireAuth, emailPerUser, emailLimiter, async (req, res) => {
  const resendKey = process.env.Resend_API;
  if (!resendKey) {
    return res.status(503).json({ error: 'Email service not configured (Resend_API missing).' });
  }

  const { to, subject, html, text } = req.body || {};
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'to, subject, and html (or text) are required.' });
  }

  // Normalize recipients to array, validate each.
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0 || recipients.length > EMAIL_LIMITS.recipients) {
    return res.status(400).json({ error: `to must contain 1–${EMAIL_LIMITS.recipients} addresses.` });
  }
  for (const addr of recipients) {
    if (typeof addr !== 'string' || hasCRLF(addr) || !EMAIL_RE.test(addr.trim())) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
  }

  // Reject header injection via subject; enforce length caps.
  if (typeof subject !== 'string' || hasCRLF(subject) || subject.length > EMAIL_LIMITS.subject) {
    return res.status(400).json({ error: `subject must be a string ≤${EMAIL_LIMITS.subject} chars with no newlines.` });
  }
  if (html && (typeof html !== 'string' || html.length > EMAIL_LIMITS.html)) {
    return res.status(400).json({ error: `html body exceeds ${EMAIL_LIMITS.html} chars.` });
  }
  if (text && (typeof text !== 'string' || text.length > EMAIL_LIMITS.text)) {
    return res.status(400).json({ error: `text body exceeds ${EMAIL_LIMITS.text} chars.` });
  }

  try {
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from:    'MulBros Media OS <onboarding@resend.dev>',
      to:      recipients,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: error.message });
    }

    // Cost ledger — Resend ~$0.0004 per email (May 2026)
    resolveProfileIdFromStytch(req.stytchUser?.userId).then(profileId => {
      logCostFireAndForget({
        userId:   profileId,
        endpoint: '/api/email',
        provider: 'resend',
        usd_cost: recipients.length * 0.0004,
        metadata: { recipient_count: recipients.length, subject: subject.slice(0, 100) },
      });
    });

    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Email proxy error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// Sprint 4 — Integrations (Mux · Stripe Connect · DocuSign · Plaid · Twilio)
// All endpoints support mock mode (no env vars set → return mock response).
// Real mode activates when env vars present. Logs source-of-truth.
// ═════════════════════════════════════════════════════════════════════════════

const integrationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many integration requests. Try again in a minute.' } },
});

// ── 4.1 Mux: direct video upload URL ──────────────────────────────────────────
// Returns a one-shot upload URL for client to PUT raw video. After upload completes
// Mux webhook updates playback_id (Sprint 5: wire webhook). Mock mode returns a
// fake upload URL that 404s on use — UI will show "Mux not configured" state.
app.post('/api/integrations/mux/upload-url', requireAuth, integrationLimiter, async (req, res) => {
  const tokenId     = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    return res.json({
      mode: 'mock',
      message: 'Mux not configured — set MUX_TOKEN_ID + MUX_TOKEN_SECRET to enable real uploads.',
      upload_url: null,
      asset_id: null,
    });
  }

  try {
    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');
    const r = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: {
          playback_policy: ['signed'],
          mp4_support: 'standard',
        },
      }),
    });
    if (!r.ok) {
      console.error('Mux upload-url failed:', r.status);
      return res.status(r.status).json({ error: { code: 'mux_upstream', message: 'Mux unavailable.' } });
    }
    const data = await r.json();
    return res.json({
      mode: 'live',
      upload_url: data.data?.url,
      upload_id: data.data?.id,
    });
  } catch (err) {
    console.error('Mux error:', err.message);
    return res.status(500).json({ error: { message: 'Mux request failed.' } });
  }
});

// ── 4.2 Stripe Connect: onboarding link + transfer ────────────────────────────
// Creates an Express-type connected account + AccountLink for talent/agency
// onboarding. Real flow: client opens returned URL → Stripe-hosted onboarding →
// returns to /settings. Mock mode returns a placeholder URL.
app.post('/api/integrations/stripe/connect/onboard', requireAuth, integrationLimiter, async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return res.json({
      mode: 'mock',
      message: 'Stripe Connect not configured — set STRIPE_SECRET_KEY (test mode OK) to enable payouts.',
      onboarding_url: null,
    });
  }

  const { return_url = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/settings`, refresh_url } = req.body || {};

  try {
    // 1. Create connected account
    const acctR = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type:         'express',
        country:      'US',
        email:        req.body?.email || '',
        capabilities: '',
      }).toString() + '&capabilities[card_payments][requested]=true&capabilities[transfers][requested]=true',
    });
    if (!acctR.ok) {
      const err = await acctR.json().catch(() => ({}));
      console.error('Stripe account create failed:', acctR.status, err);
      return res.status(acctR.status).json({ error: { code: 'stripe_upstream', message: 'Stripe account creation failed.' } });
    }
    const acct = await acctR.json();

    // 2. Create onboarding link
    const linkR = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account:     acct.id,
        refresh_url: refresh_url || return_url,
        return_url:  return_url,
        type:        'account_onboarding',
      }).toString(),
    });
    if (!linkR.ok) {
      const err = await linkR.json().catch(() => ({}));
      console.error('Stripe link create failed:', linkR.status, err);
      return res.status(linkR.status).json({ error: { code: 'stripe_upstream', message: 'Stripe onboarding link failed.' } });
    }
    const link = await linkR.json();

    return res.json({
      mode: 'live',
      onboarding_url: link.url,
      account_id:     acct.id,
      expires_at:     link.expires_at,
    });
  } catch (err) {
    console.error('Stripe Connect error:', err.message);
    return res.status(500).json({ error: { message: 'Stripe request failed.' } });
  }
});

// ── 4.3 DocuSign: send envelope from template-less HTML ───────────────────────
// JWT auth flow assumed. Mock mode returns fake envelope_id.
app.post('/api/integrations/docusign/envelope', requireAuth, integrationLimiter, async (req, res) => {
  const dsAccountId    = process.env.DOCUSIGN_ACCOUNT_ID;
  const dsAccessToken  = process.env.DOCUSIGN_ACCESS_TOKEN;  // bearer token from OAuth/JWT
  const dsBaseUrl      = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';

  if (!dsAccountId || !dsAccessToken) {
    return res.json({
      mode: 'mock',
      message: 'DocuSign not configured — set DOCUSIGN_ACCOUNT_ID + DOCUSIGN_ACCESS_TOKEN to enable signing flow.',
      envelope_id: null,
    });
  }

  const { contract_html, contract_pdf_base64, signer_email, signer_name, subject = 'Contract for signature' } = req.body || {};
  if (!signer_email || !signer_name) {
    return res.status(400).json({ error: { message: 'signer_email + signer_name required.' } });
  }

  const documentBase64 = contract_pdf_base64 || Buffer.from(contract_html || '<html><body>Empty contract</body></html>').toString('base64');

  try {
    const r = await fetch(`${dsBaseUrl}/v2.1/accounts/${dsAccountId}/envelopes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dsAccessToken}` },
      body: JSON.stringify({
        emailSubject: subject,
        status:       'sent',
        documents: [{
          documentBase64,
          name:         subject,
          fileExtension: contract_pdf_base64 ? 'pdf' : 'html',
          documentId:   '1',
        }],
        recipients: {
          signers: [{
            email:     signer_email,
            name:      signer_name,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [{ documentId: '1', pageNumber: '1', xPosition: '100', yPosition: '700' }],
            },
          }],
        },
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error('DocuSign envelope failed:', r.status, err);
      return res.status(r.status).json({ error: { code: 'docusign_upstream', message: 'DocuSign envelope creation failed.' } });
    }
    const data = await r.json();
    return res.json({ mode: 'live', envelope_id: data.envelopeId, status: data.status });
  } catch (err) {
    console.error('DocuSign error:', err.message);
    return res.status(500).json({ error: { message: 'DocuSign request failed.' } });
  }
});

// ── 4.4 Plaid: create link token for client Link SDK ──────────────────────────
// Real flow: server creates link_token → client uses Plaid Link → returns
// public_token → server exchanges for access_token (separate endpoint).
app.post('/api/integrations/plaid/link-token', requireAuth, integrationLimiter, async (req, res) => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = process.env.PLAID_ENV || 'sandbox';

  if (!clientId || !secret) {
    return res.json({
      mode: 'mock',
      message: 'Plaid not configured — set PLAID_CLIENT_ID + PLAID_SECRET (sandbox OK) to enable bank sync.',
      link_token: null,
    });
  }

  const baseUrl = env === 'production' ? 'https://production.plaid.com'
                : env === 'development' ? 'https://development.plaid.com'
                : 'https://sandbox.plaid.com';

  try {
    const r = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:    clientId,
        secret,
        user:         { client_user_id: req.stytchUser?.userId || 'unknown' },
        client_name:  'MulBros Media OS',
        products:     ['transactions'],
        country_codes: ['US'],
        language:     'en',
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error('Plaid link-token failed:', r.status, err);
      return res.status(r.status).json({ error: { code: 'plaid_upstream', message: 'Plaid link token failed.' } });
    }
    const data = await r.json();
    return res.json({ mode: 'live', link_token: data.link_token, expiration: data.expiration });
  } catch (err) {
    console.error('Plaid error:', err.message);
    return res.status(500).json({ error: { message: 'Plaid request failed.' } });
  }
});

// ── 4.5 Twilio SMS: send booking/audition reminder ────────────────────────────
app.post('/api/integrations/twilio/sms', requireAuth, integrationLimiter, async (req, res) => {
  const sid  = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  const { to, message } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ error: { message: 'to + message required.' } });
  }
  if (message.length > 1600) {
    return res.status(400).json({ error: { message: 'Message too long (1600 char max).' } });
  }

  if (!sid || !auth || !from) {
    return res.json({
      mode: 'mock',
      message: 'Twilio not configured — set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER to enable SMS.',
      sid: null,
    });
  }

  try {
    const credentials = Buffer.from(`${sid}:${auth}`).toString('base64');
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To:   to,
        From: from,
        Body: message.slice(0, 1600),
      }).toString(),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error('Twilio SMS failed:', r.status, err);
      return res.status(r.status).json({ error: { code: 'twilio_upstream', message: 'Twilio SMS failed.' } });
    }
    const data = await r.json();
    return res.json({ mode: 'live', sid: data.sid, status: data.status });
  } catch (err) {
    console.error('Twilio error:', err.message);
    return res.status(500).json({ error: { message: 'Twilio request failed.' } });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// Sprint 5 — Webhooks (Mux · DocuSign) + Plaid exchange
// ═════════════════════════════════════════════════════════════════════════════

// Helper — service-role PATCH against any table (bypasses RLS).
const supabaseServicePatch = async (table, filter, patch) => {
  if (!process.env.SUPABASE_JWT_SECRET || !process.env.VITE_SUPABASE_URL) return false;
  const svcJwt = mintServiceJwt();
  if (!svcJwt) return false;
  try {
    const r = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${svcJwt}`,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify(patch),
    });
    return r.ok;
  } catch (err) {
    console.error(`[supabaseServicePatch] ${table} failed:`, err.message);
    return false;
  }
};

// Helper — service-role POST insert (bypasses RLS).
const supabaseServiceInsert = async (table, rows) => {
  if (!process.env.SUPABASE_JWT_SECRET || !process.env.VITE_SUPABASE_URL) return false;
  const svcJwt = mintServiceJwt();
  if (!svcJwt) return false;
  try {
    const r = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${svcJwt}`,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    });
    return r.ok;
  } catch (err) {
    console.error(`[supabaseServiceInsert] ${table} failed:`, err.message);
    return false;
  }
};

// ── 5.3 Mux webhook: fired on upload + asset state changes ────────────────────
// Mux signs each request: `mux-signature: t=<ts>,v1=<hmac>`.
// HMAC is SHA256 of `${t}.${rawBody}` with MUX_WEBHOOK_SECRET.
// Events handled:
//   video.upload.asset_created → set mux_asset_id, status='processing'
//   video.asset.ready          → set mux_playback_id, duration, status='ready'
//   video.asset.errored        → status='errored'
app.post('/api/webhooks/mux', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  const raw    = req.body instanceof Buffer ? req.body.toString('utf8') : '';

  // Verify signature when secret is configured.
  if (secret) {
    const sigHdr = req.headers['mux-signature'] || '';
    const parts  = String(sigHdr).split(',').reduce((acc, p) => {
      const [k, v] = p.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});
    const t  = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) {
      return res.status(400).json({ error: { message: 'Missing mux-signature.' } });
    }
    const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: { message: 'Invalid mux-signature.' } });
    }
  } else {
    console.warn('[mux-webhook] MUX_WEBHOOK_SECRET not set — accepting unverified payload (dev mode).');
  }

  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    return res.status(400).json({ error: { message: 'Invalid JSON.' } });
  }
  const { type, data } = payload || {};
  if (!type || !data) return res.status(200).json({ ok: true }); // ack and ignore

  try {
    if (type === 'video.upload.asset_created') {
      const uploadId = data.id || data.upload_id;
      const assetId  = data.asset_id;
      if (uploadId && assetId) {
        await supabaseServicePatch(
          'self_tapes',
          `mux_upload_id=eq.${encodeURIComponent(uploadId)}`,
          { mux_asset_id: assetId, status: 'processing', updated_at: new Date().toISOString() },
        );
      }
    } else if (type === 'video.asset.ready') {
      const assetId    = data.id;
      const playbackId = Array.isArray(data.playback_ids) ? data.playback_ids[0]?.id : null;
      const duration   = data.duration ? Math.round(data.duration) : null;
      if (assetId) {
        await supabaseServicePatch(
          'self_tapes',
          `mux_asset_id=eq.${encodeURIComponent(assetId)}`,
          {
            ...(playbackId ? { mux_playback_id: playbackId } : {}),
            ...(duration   ? { duration_seconds: duration } : {}),
            status:     'ready',
            updated_at: new Date().toISOString(),
          },
        );
      }
    } else if (type === 'video.asset.errored') {
      const assetId = data.id;
      if (assetId) {
        await supabaseServicePatch(
          'self_tapes',
          `mux_asset_id=eq.${encodeURIComponent(assetId)}`,
          { status: 'errored', updated_at: new Date().toISOString() },
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[mux-webhook] handler failed:', err.message);
    res.status(500).json({ error: { message: 'Webhook handler failed.' } });
  }
});

// ── 5.4 DocuSign Connect webhook: envelope status changes ─────────────────────
// DocuSign Connect can POST JSON or XML; we accept JSON Connect 2.0 format.
// Optional HMAC verification via `X-DocuSign-Signature-1` header
// (HMAC SHA256 of raw body with DOCUSIGN_HMAC_KEY, base64-encoded).
const DS_STATUS_MAP = {
  sent:      'sent',
  delivered: 'delivered',
  signed:    'signed',
  completed: 'completed',
  declined:  'declined',
  voided:    'voided',
  // viewed via recipient event
};
app.post('/api/webhooks/docusign', express.raw({ type: '*/*' }), async (req, res) => {
  const hmacKey = process.env.DOCUSIGN_HMAC_KEY;
  const raw     = req.body instanceof Buffer ? req.body.toString('utf8') : '';

  if (hmacKey) {
    const provided = req.headers['x-docusign-signature-1'] || '';
    const expected = crypto.createHmac('sha256', hmacKey).update(raw).digest('base64');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(provided), 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: { message: 'Invalid DocuSign signature.' } });
    }
  } else {
    console.warn('[docusign-webhook] DOCUSIGN_HMAC_KEY not set — accepting unverified payload (dev mode).');
  }

  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    // XML payloads not supported in this scaffold — ack & ignore so DocuSign doesn't retry forever
    console.warn('[docusign-webhook] non-JSON payload received; ignoring.');
    return res.json({ ok: true });
  }

  // Connect 2.0 shape: { event, data: { envelopeId, envelopeSummary: { status, ... } } }
  const envelopeId = payload?.data?.envelopeId
                  || payload?.envelopeId
                  || payload?.data?.envelopeSummary?.envelopeId;
  const rawStatus  = payload?.data?.envelopeSummary?.status
                  || payload?.status
                  || payload?.event
                  || '';
  const mapped = DS_STATUS_MAP[String(rawStatus).toLowerCase()] || null;

  if (!envelopeId || !mapped) {
    return res.json({ ok: true }); // ack — nothing actionable
  }

  try {
    const patch = {
      status: mapped,
      ...(mapped === 'signed' || mapped === 'completed'
        ? { signed_at: new Date().toISOString() }
        : {}),
    };
    await supabaseServicePatch(
      'docusign_envelopes',
      `envelope_id=eq.${encodeURIComponent(envelopeId)}`,
      patch,
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[docusign-webhook] handler failed:', err.message);
    res.status(500).json({ error: { message: 'Webhook handler failed.' } });
  }
});

// ── 5.5 Plaid: exchange public_token → access_token + sync transactions ───────
// Step 1 of two: client returns public_token from Link SDK → server exchanges
// for access_token + item_id, persists in user_integrations(service='plaid').
app.post('/api/integrations/plaid/exchange', requireAuth, integrationLimiter, async (req, res) => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = process.env.PLAID_ENV || 'sandbox';

  if (!clientId || !secret) {
    return res.json({ mode: 'mock', message: 'Plaid not configured.' });
  }

  const { public_token } = req.body || {};
  if (!public_token) {
    return res.status(400).json({ error: { message: 'public_token required.' } });
  }

  const baseUrl = env === 'production' ? 'https://production.plaid.com'
                : env === 'development' ? 'https://development.plaid.com'
                : 'https://sandbox.plaid.com';

  try {
    const r = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ client_id: clientId, secret, public_token }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error('Plaid exchange failed:', r.status, err);
      return res.status(r.status).json({ error: { code: 'plaid_upstream', message: 'Plaid token exchange failed.' } });
    }
    const data      = await r.json();
    const profileId = await resolveProfileIdFromStytch(req.stytchUser?.userId);
    if (!profileId) {
      return res.status(403).json({ error: { message: 'Profile not found.' } });
    }
    await supabaseServiceInsert('user_integrations', {
      user_id:       profileId,
      service:       'plaid',
      access_token:  data.access_token,
      metadata:      { item_id: data.item_id, env },
    });
    return res.json({ mode: 'live', item_id: data.item_id });
  } catch (err) {
    console.error('Plaid exchange error:', err.message);
    return res.status(500).json({ error: { message: 'Plaid exchange failed.' } });
  }
});

// Step 2: pull recent transactions → insert into income_records with auto category.
// Lightweight categorizer: amount > 0 income source → '1099_indie' default.
const categorizePlaidTxn = (txn) => {
  const name = (txn.name || '').toLowerCase();
  if (/residual|royalty/.test(name)) return 'residual';
  if (/voiceover|vo /.test(name))    return 'voiceover';
  if (/sag|aftra|union/.test(name))  return 'w2_session';
  return '1099_indie';
};
app.post('/api/integrations/plaid/sync-transactions', requireAuth, integrationLimiter, async (req, res) => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = process.env.PLAID_ENV || 'sandbox';

  if (!clientId || !secret) {
    return res.json({ mode: 'mock', synced: 0 });
  }

  const profileId = await resolveProfileIdFromStytch(req.stytchUser?.userId);
  if (!profileId) {
    return res.status(403).json({ error: { message: 'Profile not found.' } });
  }

  // Fetch stored access_token from user_integrations
  const svcJwt = mintServiceJwt();
  if (!svcJwt) {
    return res.status(503).json({ error: { message: 'Service auth unavailable.' } });
  }
  const baseUrl = env === 'production' ? 'https://production.plaid.com'
                : env === 'development' ? 'https://development.plaid.com'
                : 'https://sandbox.plaid.com';

  try {
    const tokR = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/user_integrations?user_id=eq.${profileId}&service=eq.plaid&select=access_token`,
      { headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${svcJwt}` } },
    );
    const rows = await tokR.json();
    const accessToken = rows[0]?.access_token;
    if (!accessToken) {
      return res.status(404).json({ error: { message: 'No Plaid account linked. Run Link flow first.' } });
    }

    // Pull last 30 days of transactions
    const end   = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const txR = await fetch(`${baseUrl}/transactions/get`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_id:    clientId,
        secret,
        access_token: accessToken,
        start_date:   start,
        end_date:     end,
        options:      { count: 100, offset: 0 },
      }),
    });
    if (!txR.ok) {
      const err = await txR.json().catch(() => ({}));
      console.error('Plaid txns failed:', txR.status, err);
      return res.status(txR.status).json({ error: { code: 'plaid_upstream', message: 'Plaid transactions failed.' } });
    }
    const txData = await txR.json();
    const txns   = Array.isArray(txData.transactions) ? txData.transactions : [];

    // Income = negative amount in Plaid's convention (money flowing in)
    const incomeRows = txns
      .filter(t => t.amount < 0 && !t.pending)
      .map(t => ({
        user_id:              profileId,
        source:               t.merchant_name || t.name || 'Plaid txn',
        amount:               Math.abs(t.amount),
        currency:             t.iso_currency_code || 'USD',
        received_at:          t.date,
        tax_year:             new Date(t.date).getFullYear(),
        category:             categorizePlaidTxn(t),
        plaid_transaction_id: t.transaction_id,
      }));

    if (incomeRows.length > 0) {
      await supabaseServiceInsert('income_records', incomeRows);
    }
    return res.json({ mode: 'live', synced: incomeRows.length, scanned: txns.length });
  } catch (err) {
    console.error('Plaid sync error:', err.message);
    return res.status(500).json({ error: { message: 'Plaid sync failed.' } });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// Platform Admin — overview API (super_admin / admin only)
// Returns aggregate cost spend + user counts + role breakdown for admin UI.
// All reads go via service JWT to bypass RLS owner_select policies.
// ═════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/overview', requireAuth, requireRole(['super_admin', 'admin']), async (_req, res) => {
  if (!process.env.SUPABASE_JWT_SECRET || !process.env.VITE_SUPABASE_URL) {
    return res.status(503).json({ error: { message: 'Admin API unavailable — Supabase env missing.' } });
  }
  const svcJwt = mintServiceJwt();
  if (!svcJwt) {
    return res.status(503).json({ error: { message: 'Service JWT mint failed.' } });
  }
  const sbHeaders = {
    apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${svcJwt}`,
  };
  const baseUrl = process.env.VITE_SUPABASE_URL;

  try {
    // Fire 4 reads in parallel
    const [profCountR, roleRowsR, costRowsR, recentCostR] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/profiles?select=id`, { headers: { ...sbHeaders, Prefer: 'count=exact' } }),
      fetch(`${baseUrl}/rest/v1/user_roles?select=user_id,role`, { headers: sbHeaders }),
      fetch(`${baseUrl}/rest/v1/cost_ledger?created_at=gte.${new Date(Date.now() - 24 * 3600_000).toISOString()}&select=provider,usd_cost,tokens_in,tokens_out`, { headers: sbHeaders }),
      fetch(`${baseUrl}/rest/v1/cost_ledger?select=user_id,endpoint,provider,model,usd_cost,created_at&order=created_at.desc&limit=20`, { headers: sbHeaders }),
    ]);

    const profileCount = Number(profCountR.headers.get('content-range')?.split('/')[1] || '0');
    const roleRows     = await roleRowsR.json();
    const costRows     = await costRowsR.json();
    const recentRows   = await recentCostR.json();

    // Role breakdown
    const roleBreakdown = roleRows.reduce((acc, r) => {
      acc[r.role] = (acc[r.role] || 0) + 1;
      return acc;
    }, {});

    // Cost today by provider
    const costByProvider = costRows.reduce((acc, r) => {
      const p = r.provider;
      if (!acc[p]) acc[p] = { provider: p, usd: 0, requests: 0, tokens_in: 0, tokens_out: 0 };
      acc[p].usd        += Number(r.usd_cost || 0);
      acc[p].tokens_in  += Number(r.tokens_in || 0);
      acc[p].tokens_out += Number(r.tokens_out || 0);
      acc[p].requests   += 1;
      return acc;
    }, {});

    const totalUsd24h = Object.values(costByProvider).reduce((sum, p) => sum + p.usd, 0);

    return res.json({
      profile_count:    profileCount,
      role_breakdown:   roleBreakdown,
      cost_24h:         {
        total_usd:    Number(totalUsd24h.toFixed(4)),
        by_provider:  Object.values(costByProvider).map(p => ({
          provider:   p.provider,
          usd:        Number(p.usd.toFixed(4)),
          requests:   p.requests,
          tokens_in:  p.tokens_in,
          tokens_out: p.tokens_out,
        })),
      },
      recent_calls:     recentRows,
    });
  } catch (err) {
    console.error('admin/overview failed:', err.message);
    return res.status(500).json({ error: { message: 'Admin overview failed.' } });
  }
});

// ── Static SPA ────────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// ── Global error envelope ────────────────────────────────────────────────────
// Ensures every uncaught error response matches { error: { code, message } }.
// Must be last middleware before listen.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[api]', req.method, req.path, err.message || err);
  const status = err.status || err.statusCode || 500;
  // Forward 5xx to Sentry (skip 4xx — those are client errors, noise)
  if (status >= 500 && process.env.SENTRY_DSN) {
    try {
      Sentry.captureException(err, {
        tags: { route: req.path, method: req.method },
        extra: { stytch_user_id: req.stytchUser?.userId },
      });
    } catch { /* noop */ }
  }
  const code   = err.code   || (status >= 500 ? 'internal_error' : 'bad_request');
  res.status(status).json({
    error: {
      code,
      message: err.message || 'Server error',
    },
  });
});

app.listen(port, () => {
  console.log(`MulBros Media OS — port ${port}`);
});
