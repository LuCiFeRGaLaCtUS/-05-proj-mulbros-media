// All AI calls go through /api/ai — proxied by Vite (dev) or Express (production)
// This avoids CORS issues with direct browser → OpenAI requests.
const AI_PROXY = '/api/ai';
const OPENAI_MODEL = 'gpt-4o-mini';

// ── Primary: OpenAI via local proxy ──────────────────────────────────────────
const callOpenAI = async (systemPrompt, messages) => {
  const response = await fetch(AI_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `AI proxy error ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
};

// ── Main entry point ──────────────────────────────────────────────────────────
export const callClaude = async (systemPrompt, messages) => {
  return await callOpenAI(systemPrompt, messages);
};

export const testClaudeKey = async () => {
  try {
    await callOpenAI('Respond with exactly: OK', [{ role: 'user', content: 'Test' }]);
    return { success: true, message: 'Connected to OpenAI (gpt-4o-mini)' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getApiKey = () => 'proxy'; // key is server-side; not needed client-side

// Legacy aliases kept so existing callers don't break
export const callOpenRouter = callClaude;
export const testOpenRouterKey = testClaudeKey;
