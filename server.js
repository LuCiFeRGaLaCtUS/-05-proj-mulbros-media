import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// ── Rate limiter — 30 req/min per IP on the AI proxy ─────────────────────────
const aiLimiter = rateLimit({
  windowMs:         60 * 1000,   // 1 minute window
  max:              30,           // max 30 requests per window per IP
  standardHeaders:  true,         // Return rate limit info in RateLimit-* headers
  legacyHeaders:    false,
  message: { error: { message: 'Too many AI requests — please wait a minute and try again.' } },
});

// ── AI proxy ──────────────────────────────────────────────────────────────────
// Priority: Authorization header from client (localStorage key via Settings)
// Fallback:  OPENAI_API_KEY env var (set on Render for production deploys)
app.post('/api/ai', aiLimiter, async (req, res) => {
  const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
  const authHeader = req.headers['authorization'] || (OPENAI_KEY ? `Bearer ${OPENAI_KEY}` : '');

  if (!authHeader) {
    return res.status(401).json({ error: { message: 'No API key provided. Add your OpenAI key in Settings.' } });
  }

  // 30-second hard timeout — protects against hung OpenAI connections
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
      },
      body:   JSON.stringify(req.body),
      signal: controller.signal,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'Request timed out after 30 seconds. Try a shorter prompt.' } });
    } else {
      res.status(500).json({ error: { message: err.message } });
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
  console.log(`MulBros Media OS — server running on port ${port}`);
});
