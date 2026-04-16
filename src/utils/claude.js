// All AI calls go through /api/ai — proxied by Vite (dev) or Express (production).
// Key injected server-side from OPENAI_API_KEY env var; localStorage override supported.

const AI_PROXY = '/api/ai';

// gpt-4o  — primary model: best quality for agents, incentive analysis, content generation
// gpt-4o-mini — used only by the FloatingChatbot for fast, cheap Q&A responses
export const MODELS = {
  primary: 'gpt-4o',
  fast:    'gpt-4o-mini',
};

export const getApiKey = () =>
  localStorage.getItem('mulbros_openai_key') || '';

const callProxy = async (model, systemPrompt, messages, apiKey) => {
  const key = apiKey || getApiKey();

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

// Primary — gpt-4o (agents, incentive analyst, content studio, newsletter builder)
export const callClaude = (systemPrompt, messages, apiKey) =>
  callProxy(MODELS.primary, systemPrompt, messages, apiKey);

// Fast — gpt-4o-mini (floating chatbot only)
export const callClaudeFast = (systemPrompt, messages, apiKey) =>
  callProxy(MODELS.fast, systemPrompt, messages, apiKey);

export const testClaudeKey = async (key) => {
  try {
    await callProxy(MODELS.primary, 'Respond with exactly: OK', [{ role: 'user', content: 'Test' }], key);
    return { success: true, message: `Connected — ${MODELS.primary}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Legacy aliases
export const callOpenRouter   = callClaude;
export const testOpenRouterKey = testClaudeKey;
