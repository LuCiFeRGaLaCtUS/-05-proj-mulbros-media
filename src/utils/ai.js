// All AI calls go through /api/ai — proxied by Vite (dev) or Express (production).
// Key injected server-side from env var; localStorage override supported.

import { fetchWithTimeout, postJson, HttpError, TimeoutError } from './http';
import { getStytchAuthHeaders } from '../lib/stytch';
import { STORAGE_KEYS, API_TIMEOUTS_MS } from '../constants';

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
    ? localStorage.getItem(STORAGE_KEYS.anthropicKey) || ''
    : localStorage.getItem(STORAGE_KEYS.openAiKey)    || '';

const callProxy = async (model, systemPrompt, messages, apiKey) => {
  const key = apiKey !== undefined ? apiKey : getApiKey(model);

  const response = await fetchWithTimeout(
    AI_PROXY,
    {
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
    },
    API_TIMEOUTS_MS.ai,
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new HttpError(err.error?.message || `API error ${response.status}`, {
      status: response.status,
      body:   err,
    });
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
export const callFirecrawlSearch = (query, subreddits, _timeframe = 'year') =>
  postJson(
    '/api/firecrawl-search',
    { query, subreddits, limit: 12 },
    { timeoutMs: API_TIMEOUTS_MS.search, headers: getStytchAuthHeaders() },
  );

/**
 * Search Reddit via Apify actor (headless browser, 30–60s) — secondary/deep scrape.
 */
export const callApifyReddit = (query, subreddits) =>
  postJson(
    '/api/apify-reddit',
    { query, subreddits, limit: 10 },
    { timeoutMs: 75_000, headers: getStytchAuthHeaders() },
  );

/**
 * OpenAI web search via Responses API + web_search_preview tool.
 * Model auto-decides whether to search. Works with gpt-4o / gpt-4o-mini.
 * Returns { text, citations: [{url, title}], source: 'openai-web-search' }.
 */
export const callAISearch = (input, system, model = MODELS.primary) =>
  postJson(
    '/api/ai-search',
    { input, system, model },
    { timeoutMs: 50_000, headers: getStytchAuthHeaders() },
  );

/** Format OpenAI web-search output into an LLM context block */
export const formatWebSearchResults = ({ text, citations = [], query }) => {
  if (!text) {
    return `[OpenAI Web Search — "${query}"]\nNo results returned.\n[End Search Data]`;
  }
  const citeBlock = citations.length
    ? '\n\nCitations:\n' + citations.map((c, i) => `[${i + 1}] ${c.title || c.url} — ${c.url}`).join('\n')
    : '';
  return `[Live Web Search via OpenAI — "${query}"]\n\n${text}${citeBlock}\n\n[End Search Data — Use ONLY this real data. Do NOT invent sources.]`;
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

// Re-export error types so callers can do typed catches without importing http directly.
export { HttpError, TimeoutError };
