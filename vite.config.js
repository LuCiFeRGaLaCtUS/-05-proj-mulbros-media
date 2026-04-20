import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// ── Dev-only Reddit search middleware ─────────────────────────────────────────
// In production, Express /api/reddit-search handles this.
// In dev, Vite doesn't run Express, so we mirror the same logic here.
const redditSearchMiddleware = {
  name: 'reddit-search-dev',
  configureServer(server) {
    server.middlewares.use('/api/reddit-search', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { query = '', subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], timeframe = 'year', limit = 15 } = JSON.parse(body || '{}');
          if (!query.trim()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'query is required' } }));
          }
          const subredditFilter = subreddits.map(s => `subreddit:${s}`).join(' OR ');
          const searchQuery     = `(${subredditFilter}) ${query.trim()}`;
          const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&t=${timeframe}&limit=${Math.min(Number(limit) || 15, 25)}&type=link`;

          const upstream = await fetch(url, {
            headers: { 'User-Agent': 'MulBrosMediaOS/2.0 (dev-proxy)', Accept: 'application/json' },
          });
          const data  = await upstream.json();
          const posts = (data?.data?.children || []).map(({ data: p }) => ({
            id:          p.id,
            subreddit:   p.subreddit,
            author:      p.author,
            title:       p.title,
            content:     (p.selftext || '').slice(0, 1200),
            url:         `https://www.reddit.com${p.permalink}`,
            score:       p.score,
            numComments: p.num_comments,
            created:     new Date(p.created_utc * 1000).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            }),
          }));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ posts, query: query.trim(), count: posts.length }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: err.message || 'Reddit search failed' } }));
        }
      });
    });
  },
};

// ── Firecrawl search dev middleware ───────────────────────────────────────────
// Mirrors the Express /api/firecrawl-search route for Vite dev server.
const firecrawlMiddleware = (env) => ({
  name: 'firecrawl-dev',
  configureServer(server) {
    server.middlewares.use('/api/firecrawl-search', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { query = '', subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], limit = 10 } = JSON.parse(body || '{}');
          const apiKey = env.FIRECRAWL_API_KEY;
          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'FIRECRAWL_API_KEY not set in .env.local' } }));
          }
          const subredditFilter = subreddits.map(s => `site:reddit.com/r/${s}`).join(' OR ');
          const searchQuery = `(${subredditFilter}) ${query.trim()}`;
          const upstream = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ query: searchQuery, limit: Math.min(Number(limit) || 10, 15), scrapeOptions: { formats: ['markdown'] } }),
          });
          const data = await upstream.json();
          const posts = (data.data || []).map(item => {
            const urlMatch = item.url?.match(/reddit\.com\/r\/(\w+)/);
            const sub = urlMatch ? urlMatch[1] : 'reddit';
            const authorMatch = (item.markdown || '').match(/Posted by u\/(\w+)/i) || (item.description || '').match(/u\/(\w+)/i);
            const author = authorMatch ? authorMatch[1] : 'unknown';
            return {
              subreddit: sub, author,
              title:   item.title || '',
              content: (item.markdown || item.description || '').slice(0, 1200),
              url:     item.url || '',
              score: null, numComments: null,
              created: item.metadata?.publishedTime
                ? new Date(item.metadata.publishedTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'recent',
            };
          });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ posts, query: query.trim(), count: posts.length, source: 'firecrawl' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: err.message || 'Firecrawl search failed' } }));
        }
      });
    });
  },
});

// ── Apify Reddit dev middleware ────────────────────────────────────────────────
const apifyMiddleware = (env) => ({
  name: 'apify-dev',
  configureServer(server) {
    server.middlewares.use('/api/apify-reddit', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { query = '', subreddits = ['indiefilm', 'filmmakers', 'filmmaking'], limit = 10 } = JSON.parse(body || '{}');
          const token = env.APIFY_API_TOKEN;
          if (!token) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'APIFY_API_TOKEN not set in .env.local' } }));
          }
          const actorUrl = `https://api.apify.com/v2/acts/apify~reddit-scraper/run-sync-get-dataset-items?token=${token}&timeout=60&memory=512`;
          const upstream = await fetch(actorUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searches: subreddits.map(s => ({ type: 'community', community: s, query: query.trim(), sort: 'relevance', time: 'year', limit: Math.ceil(limit / subreddits.length) })),
              maxItems: Math.min(Number(limit) || 10, 20),
            }),
          });
          const items = await upstream.json();
          const posts = (Array.isArray(items) ? items : []).map(item => ({
            subreddit: item.community || item.subreddit || 'reddit',
            author:    item.username  || item.author    || 'unknown',
            title:     item.title     || '',
            content:   (item.body || item.text || '').slice(0, 1200),
            url:       item.url || `https://reddit.com/r/${item.community}/comments/${item.id}`,
            score:     item.upVotes || item.score || 0,
            numComments: item.numberOfComments || 0,
            created:   item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'recent',
          }));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ posts, query: query.trim(), count: posts.length, source: 'apify' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: err.message || 'Apify scrape failed' } }));
        }
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const OPENAI_KEY = env.OPENAI_API_KEY || '';

  return {
    plugins: [react(), redditSearchMiddleware, firecrawlMiddleware(env), apifyMiddleware(env)],

    server: {
      port: 5173,
      host: true,
      proxy: {
        // Weather: browser always fetches /api/weather (same-origin).
        // In dev, Vite forwards directly to wttr.in.
        // In production, Express /api/weather handles it server-side.
        '/api/weather': {
          target:       'https://wttr.in',
          changeOrigin: true,
          rewrite:      () => '/Los+Angeles,California?format=j1',
        },
        '/api/ai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: () => '/v1/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Prefer env key; fall back to key sent by the client (from localStorage via Settings)
              const authKey = OPENAI_KEY || (req.headers['authorization']?.replace('Bearer ', '') || '');
              if (authKey) {
                proxyReq.setHeader('Authorization', `Bearer ${authKey}`);
              }
              proxyReq.setHeader('Content-Type', 'application/json');
            });
          },
        }
      }
    },

    base: './',

    build: {
      outDir:               'dist',
      sourcemap:            false,
      chunkSizeWarningLimit: 600, // jsPDF is legitimately ~570 kB; suppress the noise
      // ── Manual chunk splitting — keeps the main bundle lean ────────────────
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return; // app code stays in index chunk

            // Heavy but infrequent: PDF generation (jsPDF + html2canvas + DOMPurify)
            if (id.includes('/jspdf/') || id.includes('/html2canvas/') || id.includes('/dompurify/')) {
              return 'vendor-pdf';
            }
            // Charting (Recharts + D3 dependencies)
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
              return 'vendor-charts';
            }
            // Drag and drop
            if (id.includes('/@dnd-kit/')) {
              return 'vendor-dnd';
            }
            // Icons
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            // Date utilities
            if (id.includes('/date-fns/')) {
              return 'vendor-dates';
            }
            // Supabase client
            if (id.includes('@supabase/')) {
              return 'vendor-supabase';
            }
            // React ecosystem + everything else → single vendor chunk (avoids circular chunks)
            return 'vendor';
          },
        },
      },
    },
  }
})
