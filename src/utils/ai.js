// All AI calls go through /api/ai — proxied by Vite (dev) or Express (production).
// Key injected server-side from env var; localStorage override supported.

const AI_PROXY = '/api/ai';

// gpt-4o     — fallback primary (OpenAI)
// gpt-4o-mini — fast chatbot (OpenAI)
// claude-sonnet-4-20250514 — per-agent default (Anthropic)
export const MODELS = {
  primary: 'gpt-4o',
  fast:    'gpt-4o-mini',
};

/** Return the localStorage API key appropriate for the given model */
export const getApiKey = (model = '') =>
  model.startsWith('claude-')
    ? localStorage.getItem('mulbros_anthropic_key') || ''
    : localStorage.getItem('mulbros_openai_key')    || '';

const callProxy = async (model, systemPrompt, messages, apiKey) => {
  const key = apiKey !== undefined ? apiKey : getApiKey(model);

  const response = await fetch(AI_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Primary — defaults to gpt-4o; pass an explicit model to use agent.model
export const callAI = (systemPrompt, messages, apiKey, model) =>
  callProxy(model || MODELS.primary, systemPrompt, messages, apiKey);

// Fast — gpt-4o-mini (floating chatbot only)
export const callAIFast = (systemPrompt, messages, apiKey) =>
  callProxy(MODELS.fast, systemPrompt, messages, apiKey);

/** Test an OpenAI key */
export const testAIKey = async (key) => {
  try {
    await callProxy(MODELS.fast, 'Respond with exactly: OK', [{ role: 'user', content: 'Test' }], key);
    return { success: true, message: `Connected — ${MODELS.fast}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Search Reddit via Firecrawl (Google-indexed) — primary search path.
 * Returns the same { posts, query, count, source } shape as all other search routes.
 */
export const callFirecrawlSearch = async (query, subreddits, _timeframe = 'year') => {
  const response = await fetch('/api/firecrawl-search', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, subreddits, limit: 12 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Firecrawl search error ${response.status}`);
  }
  return response.json(); // { posts, query, count, source: 'firecrawl' }
};

/**
 * Search Reddit via Apify actor (headless browser, 30–60s) — secondary/deep scrape.
 */
export const callApifyReddit = async (query, subreddits) => {
  const response = await fetch('/api/apify-reddit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, subreddits, limit: 10 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Apify error ${response.status}`);
  }
  return response.json(); // { posts, query, count, source: 'apify' }
};

// Keep callRedditSearch as alias → now points to Firecrawl
export const callRedditSearch = callFirecrawlSearch;

/** Format search results (Firecrawl, Apify, or Reddit API) into an LLM context block */
export const formatRedditResults = ({ posts, query, count, source }) => {
  const sourceLabel = source === 'firecrawl' ? 'Firecrawl (Google-indexed)'
    : source === 'apify' ? 'Apify (scraped)'
    : 'Reddit API';
  if (!posts?.length) {
    return `[Reddit Search via ${sourceLabel} — "${query}"]\nNo posts found for this query. The topic may use different terminology or be in private communities.\n[End Search Data]`;
  }
  const lines = posts.map((p, i) => [
    `[${i + 1}] r/${p.subreddit} — u/${p.author} — ${p.created}`,
    `Title: ${p.title}`,
    p.content ? `Content: ${p.content.substring(0, 500)}${p.content.length > 500 ? '…' : ''}` : '',
    `Link: ${p.url}`,
    p.score != null ? `Score: ${p.score} · ${p.numComments} comments` : '',
  ].filter(Boolean).join('\n')).join('\n\n');

  return `[Live Reddit Search via ${sourceLabel} — "${query}" — ${count} posts found]\n\n${lines}\n\n[End Search Data — Use ONLY this real data. Do NOT invent any usernames, projects, or details not present above.]`;
};

/** Test an Anthropic key */
export const testAnthropicKey = async (key) => {
  try {
    await callProxy('claude-3-5-haiku-20241022', 'Respond with exactly: OK', [{ role: 'user', content: 'Test' }], key);
    return { success: true, message: 'Connected — claude-3-5-haiku' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
