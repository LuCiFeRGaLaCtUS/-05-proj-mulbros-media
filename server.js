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
  'gpt-4o',
  'gpt-4o-mini',
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-4-5-20251001',
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
  const apiKey      = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || '';
  const authHeader  = req.headers['authorization'] || (apiKey ? `Bearer ${apiKey}` : '');

  if (!authHeader) {
    return res.status(401).json({ error: { message: 'No API key provided. Add your key in Settings.' } });
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  try {
    let apiUrl, body, headers;

    if (isAnthropic) {
      // Anthropic Messages API format
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMsgs  = messages.filter(m => m.role !== 'system');
      const apiKeyVal = authHeader.replace('Bearer ', '');
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
        'Authorization': authHeader,
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

// ── Static SPA ────────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`MulBros Media OS — port ${port}`);
});
