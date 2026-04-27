import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { Resend } from 'resend';
import * as stytch from 'stytch';
import jwt from 'jsonwebtoken';

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

// ── Role-gate middleware ──────────────────────────────────────────────────────
// Uses user_roles table (Supabase REST) keyed by profile.id (stytch_user_id → profile).
// Requires requireAuth upstream. Allows request if user's role is in `allowed`.
const requireRole = (allowed) => async (req, res, next) => {
  try {
    const stytchUid = req.stytchUser?.userId;
    if (!stytchUid) return res.status(401).json({ error: { code: 'unauthorized', message: 'Auth required.' } });
    const sbHeaders = {
      apikey:        process.env.VITE_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
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
// Mint a service-role JWT (HS256, role=service_role) for internal Supabase ops
// that bypass RLS — used by server for profile lookup + auto-creation.
const mintServiceJwt = () => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { aud: 'authenticated', role: 'service_role', iss: 'mulbros-bridge-svc', iat: now, exp: now + 600 },
    process.env.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' },
  );
};

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
      return res.status(r.status).json({ error: { message: data.error?.message || `OpenAI error ${r.status}` } });
    }

    const outputs     = Array.isArray(data.output) ? data.output : [];
    const contentArr  = outputs.flatMap(o => Array.isArray(o.content) ? o.content : []);
    const text        = contentArr.filter(c => c.type === 'output_text').map(c => c.text).join('\n');
    const citations   = contentArr
      .flatMap(c => Array.isArray(c.annotations) ? c.annotations : [])
      .filter(a => a.type === 'url_citation')
      .map(a => ({ url: a.url, title: a.title || a.url, start: a.start_index, end: a.end_index }));

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
      return res.status(response.status).json({ error: { message: err.error || `Firecrawl error ${response.status}` } });
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
      return res.status(response.status).json({ error: { message: err.error?.message || `Apify error ${response.status}` } });
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

    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Email proxy error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
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
