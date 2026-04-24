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
          const apiKey = env.Personal_Free_FIRECRAWL_API_KEY || env.FIRECRAWL_API_KEY;
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
          if (!upstream.ok) {
            // Surface upstream errors (402 quota, 401 bad key, etc.) so client can cascade to fallbacks
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: data?.error?.message || data?.error || `Firecrawl error ${upstream.status}` } }));
          }
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
          const slug = env.APIFY_REDDIT_ACTOR || 'trudax~reddit-scraper-lite';
          const actorUrl = `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items?token=${token}&timeout=60&memory=512`;
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
          if (Array.isArray(subreddits) && subreddits.length === 1) {
            input.searchCommunityName = subreddits[0];
          }
          const upstream = await fetch(actorUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const items = await upstream.json();
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: items?.error?.message || items?.error || `Apify error ${upstream.status}` } }));
          }
          const posts = (Array.isArray(items) ? items : []).map(item => ({
            subreddit: item.communityName || item.community || item.subreddit || 'reddit',
            author:    item.username       || item.author    || 'unknown',
            title:     item.title          || '',
            content:   (item.body || item.text || '').slice(0, 1200),
            url:       item.url || `https://reddit.com/r/${item.communityName || item.community}/comments/${item.id}`,
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

// ── OpenAI web-search dev middleware (Responses API) ──────────────────────────
const aiSearchMiddleware = (env) => ({
  name: 'ai-search-dev',
  configureServer(server) {
    server.middlewares.use('/api/ai-search', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { model = 'gpt-4o', input, system } = JSON.parse(body || '{}');
          if (!input || typeof input !== 'string' || !input.trim()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'input must be a non-empty string.' } }));
          }
          if (!['gpt-4o', 'gpt-4o-mini'].includes(model)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'model must be gpt-4o or gpt-4o-mini.' } }));
          }
          const apiKey = env.OPENAI_API_KEY || (req.headers['authorization'] || '').replace('Bearer ', '').trim();
          if (!apiKey) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: 'OPENAI_API_KEY not set in .env.local' } }));
          }
          const bodyObj     = JSON.parse(body || '{}');
          const forceSearch = bodyObj.forceSearch !== false;
          const today       = new Date().toISOString().slice(0, 10);
          const guard = `Today is ${today}. RULES: (1) Stay in character as defined above — never identify as "SearchGPT", "an AI assistant", or any other persona. (2) You MUST call the web_search tool for this query. Do not claim you searched if you did not. (3) Only cite URLs the tool actually returned. Never fabricate URLs, usernames, or post details. (4) If the tool returns nothing useful, state exactly that — do not list generic resources as a substitute.`;
          const upstream = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model,
              tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
              ...(forceSearch ? { tool_choice: { type: 'web_search_preview' } } : { tool_choice: 'auto' }),
              instructions: system ? `${system}\n\n${guard}` : guard,
              input,
            }),
          });
          const data = await upstream.json();
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: { message: data.error?.message || `OpenAI error ${upstream.status}` } }));
          }
          const outputs    = Array.isArray(data.output) ? data.output : [];
          const contentArr = outputs.flatMap(o => Array.isArray(o.content) ? o.content : []);
          const text       = contentArr.filter(c => c.type === 'output_text').map(c => c.text).join('\n');
          const citations  = contentArr
            .flatMap(c => Array.isArray(c.annotations) ? c.annotations : [])
            .filter(a => a.type === 'url_citation')
            .map(a => ({ url: a.url, title: a.title || a.url, start: a.start_index, end: a.end_index }));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ text, citations, source: 'openai-web-search' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: err.message || 'Web search failed' } }));
        }
      });
    });
  },
});

// ── Spotify OAuth dev middleware ──────────────────────────────────────────────
// Mirrors the Express /api/spotify/* routes for local dev on port 5173.
const SPOTIFY_SCOPES_DEV = 'user-read-private user-top-read user-read-recently-played';

const spotifySupaHeaders = (env) => ({
  apikey:        env.VITE_SUPABASE_ANON_KEY || '',
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY || ''}`,
  'Content-Type': 'application/json',
});
const spotifySupaUrl = (env, path) => `${env.VITE_SUPABASE_URL}/rest/v1/${path}`;

const spotifyMiddleware = (env) => ({
  name: 'spotify-dev',
  configureServer(server) {
    const upsert = async ({ profileId, access, refresh, expiresInSec, scope }) => {
      const expires_at = new Date(Date.now() + Math.max(0, (expiresInSec || 3600) - 60) * 1000).toISOString();
      const row = {
        user_id: profileId, service: 'spotify',
        access_token: access, refresh_token: refresh || null,
        expires_at, metadata: { scope: scope || SPOTIFY_SCOPES_DEV, updated_at: new Date().toISOString() },
      };
      const r = await fetch(spotifySupaUrl(env, 'user_integrations?on_conflict=user_id,service'), {
        method: 'POST',
        headers: { ...spotifySupaHeaders(env), Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(row),
      });
      if (!r.ok) throw new Error(`Supabase upsert failed ${r.status}`);
    };
    const read = async (profileId) => {
      const r = await fetch(
        spotifySupaUrl(env, `user_integrations?user_id=eq.${profileId}&service=eq.spotify&select=*`),
        { headers: spotifySupaHeaders(env) },
      );
      if (!r.ok) throw new Error(`Supabase read failed ${r.status}`);
      const rows = await r.json();
      return rows[0] || null;
    };
    const refreshIfNeeded = async (row) => {
      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
      if (expiresAt > Date.now() + 30_000) return row.access_token;
      if (!row.refresh_token) throw new Error('No refresh token on file');
      const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      const r = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: row.refresh_token }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error_description || `Spotify refresh failed ${r.status}`);
      await upsert({
        profileId:    row.user_id,
        access:       data.access_token,
        refresh:      data.refresh_token || row.refresh_token,
        expiresInSec: data.expires_in,
        scope:        data.scope,
      });
      return data.access_token;
    };

    // /api/spotify/auth — redirect
    server.middlewares.use('/api/spotify/auth', (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const profileId = url.searchParams.get('profile_id');
      if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_REDIRECT_URI) {
        res.statusCode = 503; return res.end('Spotify not configured');
      }
      if (!profileId) { res.statusCode = 400; return res.end('profile_id required'); }
      const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id:     env.SPOTIFY_CLIENT_ID,
        scope:         SPOTIFY_SCOPES_DEV,
        redirect_uri:  env.SPOTIFY_REDIRECT_URI,
        state:         profileId,
        show_dialog:   'true',
      });
      res.statusCode = 302;
      res.setHeader('Location', authUrl);
      res.end();
    });

    // /api/spotify/callback — exchange + store + redirect
    server.middlewares.use('/api/spotify/callback', async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code  = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const appUrl = env.VITE_APP_URL || 'http://localhost:5173';
      const backTo = `${appUrl}/vertical/musician`;
      const redirect = (qs) => { res.statusCode = 302; res.setHeader('Location', `${backTo}?${qs}`); res.end(); };

      if (error) return redirect('spotify=denied');
      if (!code || !state) return redirect('spotify=missing_params');
      if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REDIRECT_URI) {
        return redirect('spotify=server_unconfigured');
      }

      try {
        const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
        const r = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: env.SPOTIFY_REDIRECT_URI }),
        });
        const data = await r.json();
        if (!r.ok) {
          console.error('Spotify exchange failed', data);
          return redirect('spotify=exchange_failed');
        }
        await upsert({
          profileId:    state,
          access:       data.access_token,
          refresh:      data.refresh_token,
          expiresInSec: data.expires_in,
          scope:        data.scope,
        });
        return redirect('spotify=connected');
      } catch (err) {
        console.error('Spotify callback error', err.message);
        return redirect('spotify=error');
      }
    });

    // /api/spotify/artist-stats — live fetch with refresh
    server.middlewares.use('/api/spotify/artist-stats', async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const profileId = url.searchParams.get('profile_id');
      const json = (status, body) => {
        res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body));
      };
      if (!profileId) return json(400, { error: { message: 'profile_id required' } });
      try {
        const row = await read(profileId);
        if (!row) return json(404, { error: { message: 'Spotify not connected' } });
        const accessToken = await refreshIfNeeded(row);
        const auth = { Authorization: `Bearer ${accessToken}` };
        const [meR, topR, recentR] = await Promise.all([
          fetch('https://api.spotify.com/v1/me', { headers: auth }),
          fetch('https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term', { headers: auth }),
          fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', { headers: auth }),
        ]);
        const [me, top, recent] = await Promise.all([meR.json(), topR.json(), recentR.json()]);
        json(200, {
          profile: {
            id: me.id, display_name: me.display_name,
            followers: me.followers?.total ?? null, country: me.country, product: me.product,
            external_url: me.external_urls?.spotify, image: me.images?.[0]?.url || null,
          },
          top_tracks: (top.items || []).map(t => ({
            name: t.name, artists: (t.artists || []).map(a => a.name).join(', '),
            url: t.external_urls?.spotify, album: t.album?.name, image: t.album?.images?.[0]?.url || null,
          })),
          recently_played: (recent.items || []).map(r => ({
            name: r.track?.name, artists: (r.track?.artists || []).map(a => a.name).join(', '),
            url: r.track?.external_urls?.spotify, played_at: r.played_at,
          })),
          connected_at: row.created_at,
        });
      } catch (err) {
        console.error('Spotify artist-stats error', err.message);
        json(500, { error: { message: err.message || 'Failed to fetch Spotify stats' } });
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const OPENAI_KEY = env.OPENAI_API_KEY || '';

  return {
    plugins: [react(), redditSearchMiddleware, firecrawlMiddleware(env), apifyMiddleware(env), aiSearchMiddleware(env), spotifyMiddleware(env)],

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
