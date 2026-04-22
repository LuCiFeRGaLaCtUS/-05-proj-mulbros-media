import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { Resend } from 'resend';
import * as stytch from 'stytch';

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
      imgSrc:      ["'self'", 'data:'],
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

const requireAuth = async (req, res, next) => {
  if (!stytchClient) {
    return res.status(503).json({
      error: { message: 'Auth not configured on server (STYTCH_PROJECT_ID / STYTCH_SECRET missing).' },
    });
  }
  const token = (req.headers['x-stytch-session-token'] || '').toString().trim()
             || (req.headers['x-stytch-session-jwt']   || '').toString().trim();
  if (!token) {
    return res.status(401).json({ error: { message: 'Missing session token.' } });
  }
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

  const apiKey = process.env.FIRECRAWL_API_KEY;
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
// Uses apify/reddit-scraper (headless browser, ~30–60s). Secondary/fallback path.
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

  const actorUrl = `https://api.apify.com/v2/acts/apify~reddit-scraper/run-sync-get-dataset-items?token=${token}&timeout=60&memory=512`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70_000);

  try {
    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searches: subreddits.map(s => ({
          type:      'community',
          community: s,
          query:     query.trim(),
          sort:      'relevance',
          time:      'year',
          limit:     Math.ceil(limit / subreddits.length),
        })),
        maxItems: Math.min(Number(limit) || 10, 20),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: { message: err.error?.message || `Apify error ${response.status}` } });
    }

    const items = await response.json();

    const posts = items.map(item => ({
      subreddit:   item.community   || item.subreddit || 'reddit',
      author:      item.username    || item.author    || 'unknown',
      title:       item.title       || '',
      content:     (item.body || item.text || '').slice(0, 1200),
      url:         item.url         || `https://reddit.com/r/${item.community}/comments/${item.id}`,
      score:       item.upVotes     || item.score       || 0,
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

app.listen(port, () => {
  console.log(`MulBros Media OS — port ${port}`);
});
