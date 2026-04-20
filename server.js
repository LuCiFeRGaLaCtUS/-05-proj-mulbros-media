import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';

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
        'wss://*.supabase.co',   // realtime subscriptions
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
  // Anthropic — use confirmed API model IDs
  'claude-3-5-sonnet-20241022',
  'claude-3-7-sonnet-20250219',
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

app.post('/api/firecrawl-search', firecrawlLimiter, async (req, res) => {
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

app.post('/api/apify-reddit', apifyLimiter, async (req, res) => {
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

// ── Static SPA ────────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`MulBros Media OS — port ${port}`);
});
