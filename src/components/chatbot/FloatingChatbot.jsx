import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { formatDataForAI } from '../../utils/appData';
import { createActionHandlers, parseUserIntent, getQuickResponses } from '../../utils/appActions';
import { callClaudeFast, getApiKey } from '../../utils/claude';

// System prompt is a function so data is always fresh on each send
const buildSystemPrompt = () => `You are the MulBros Global Assistant — an AI that helps users navigate and get information from MulBros Media OS.

You have access to live data from the system:
${formatDataForAI()}

CAPABILITIES:
1. Answer questions about any data above with specific numbers
2. Navigate the app — valid pages: dashboard, financing, productions, music, agents, settings
3. Open Agent Chat for a specific agent
4. To navigate, include [NAVIGATE:pageid] anywhere in your response (e.g. [NAVIGATE:financing])

RESPONSE STYLE:
- Concise, specific, use real numbers
- If asked to navigate, include the [NAVIGATE:x] token AND confirm in text
- Never invent data not shown above

VALID PAGE IDs: dashboard, financing, productions, music, agents, settings`;

export const FloatingChatbot = ({ appState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your MulBros Global Assistant. I can help you with:\n\n• Luke's revenue and pipeline\n• Talise's streaming stats\n• Campaign status\n• Navigate to any page\n• Chat with specific agents\n\nJust ask me a question!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const actions = createActionHandlers(appState);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const intent = parseUserIntent(userMessage);
      const skipAI = ['help', 'lukeRevenue', 'lukePipeline', 'taliseStats', 'lastCounty', 'campaigns', 'community', 'analytics'].includes(intent);

      if (!skipAI) {
        const apiKey = getApiKey();
        // Build system prompt fresh each call so data is always current
        const response = await callClaudeFast(
          buildSystemPrompt(),
          newMessages.map(({ role, content }) => ({ role, content })),
          apiKey
        );

        // Handle navigation token — supports hyphens e.g. [NAVIGATE:film-financing]
        const navMatch = response.match(/\[NAVIGATE:([\w-]+)\]/);
        if (navMatch) actions.navigate(navMatch[1]);

        const clean = response.replace(/\[NAVIGATE:[\w-]+\]/, '').trim();
        setMessages([...newMessages, { role: 'assistant', content: clean }]);
      } else {
        // Handle navigation intent locally
        if (intent === 'navigate') {
          const pageMap = { dashboard: 'dashboard', financing: 'financing', 'film financing': 'financing', productions: 'productions', music: 'music', agents: 'agents', settings: 'settings' };
          const pageMatch = userMessage.match(/(?:go to|navigate|open)\s+(?:the\s+)?(.+)/i);
          if (pageMatch) {
            const key = pageMatch[1].toLowerCase().trim();
            const page = pageMap[key] || key;
            actions.navigate(page);
          }
        }
        setMessages([...newMessages, { role: 'assistant', content: getQuickResponses(intent) }]);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Sorry, I couldn't get a response. ${err.message?.includes('API') ? 'Check your OpenAI key in Settings.' : err.message || 'Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    const msg = input.trim();
    setInput('');
    sendMessage(msg);
  };

  // Fix: quick action buttons pass text directly to sendMessage — no stale closure
  const handleQuickAction = (text) => sendMessage(text);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg shadow-amber-500/20 flex items-center justify-center transition-all z-50 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'
        }`}
      >
        <MessageCircle size={24} className="text-zinc-950" />
      </button>

      <div className={`fixed bottom-6 right-6 w-96 h-[520px] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col z-50 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span className="font-semibold text-zinc-100">MulBros Assistant</span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">gpt-4o-mini</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 p-3 rounded-xl flex items-center gap-2">
                <Loader2 size={14} className="text-amber-400 animate-spin" />
                <span className="text-xs text-zinc-500">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions + input */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {["Luke's revenue", "Talise stats", "Show campaigns", "Go to Film Financing"].map(label => (
              <button
                key={label}
                onClick={() => handleQuickAction(label)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-zinc-400 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 rounded-lg p-2 transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
