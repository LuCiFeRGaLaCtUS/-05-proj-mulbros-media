const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

export const callOpenRouter = async (systemPrompt, messages, apiKey) => {
  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings > API Keys.');
  }

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin || 'http://localhost:5173',
      'X-Title': 'Mulbros Marketing OS',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: formattedMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenRouter API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const testOpenRouterKey = async (apiKey) => {
  try {
    const result = await callOpenRouter(
      'Respond with exactly: OK',
      [{ role: 'user', content: 'Test' }],
      apiKey
    );
    return { success: true, message: 'Connected' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getApiKey = () => {
  return localStorage.getItem('mulbros_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

export const callClaude = callOpenRouter;
export const testClaudeKey = testOpenRouterKey;