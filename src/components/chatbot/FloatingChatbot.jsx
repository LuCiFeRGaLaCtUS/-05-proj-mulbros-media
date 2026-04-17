import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Clapperboard, Film, Star, Mic, DollarSign, Users } from 'lucide-react';
import { formatDataForAI } from '../../utils/appData';
import { createActionHandlers, parseUserIntent, getQuickResponses } from '../../utils/appActions';
import { callAIFast, getApiKey } from '../../utils/ai';

const buildSystemPrompt = () => `You are the MulBros Studio AI — an intelligent assistant embedded in MulBros Media OS.

You have access to live data from the system:
${formatDataForAI()}

CAPABILITIES:
1. Answer questions about any data above with specific numbers
2. Navigate the app — valid pages: dashboard, financing, productions, music, agents, settings
3. To navigate, include [NAVIGATE:pageid] anywhere in your response (e.g. [NAVIGATE:financing])

RESPONSE STYLE:
- Concise, specific, use real numbers from the data
- If asked to navigate, include the [NAVIGATE:x] token AND confirm in text
- Never invent data not shown above

VALID PAGE IDS: dashboard, financing, productions, music, agents, settings`;

// ── Quick action config ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Luke's revenue",       icon: DollarSign, prompt: "Luke's revenue" },
  { label: 'Talise stats',         icon: Star,       prompt: 'Talise stats'   },
  { label: 'Show campaigns',       icon: Film,       prompt: 'Show campaigns' },
  { label: 'Film Financing',       icon: Mic,        prompt: 'Go to Film Financing' },
];

// ── Animated trigger button ────────────────────────────────────────────────────
const TriggerButton = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    aria-label="Open Studio AI"
    className={`fixed bottom-6 right-6 z-[9999] group focus:outline-none transition-all duration-300 ${
      isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
    }`}
  >
    {/* outermost slow pulse ring */}
    <span className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping pointer-events-none" style={{ animationDuration: '2.4s' }} />
    {/* mid decorative ring */}
    <span className="absolute -inset-1.5 rounded-full border border-amber-500/20 pointer-events-none group-hover:border-amber-500/40 transition-colors" />
    {/* inner decorative ring */}
    <span className="absolute -inset-0.5 rounded-full border border-amber-500/10 pointer-events-none" />

    {/* button body — cinematic gradient */}
    <span className="relative flex w-16 h-16 rounded-full items-center justify-center
      bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400
      shadow-xl shadow-amber-500/40
      group-hover:shadow-amber-500/60 group-hover:scale-105
      transition-all duration-300">
      {/* film strip holes top */}
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
        {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-[1px] bg-zinc-900/30" />)}
      </span>
      <Clapperboard size={24} className="text-zinc-950 drop-shadow" />
      {/* film strip holes bottom */}
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
        {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-[1px] bg-zinc-900/30" />)}
      </span>
    </span>

    {/* "AI" badge */}
    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-amber-500/60 flex items-center justify-center pointer-events-none">
      <span className="text-[8px] font-black text-amber-400 leading-none">AI</span>
    </span>
  </button>
);

// ── Chat window ────────────────────────────────────────────────────────────────
export const FloatingChatbot = ({ appState }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Lights. Camera. Action! I'm your MulBros Studio AI.\n\nI can pull up:\n• Luke's revenue & pipeline\n• Talise's streaming numbers\n• Campaign status across all verticals\n• Navigate anywhere in the OS\n\nWhat's on your call sheet?"
    }
  ]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const actions = createActionHandlers(appState);

  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const intent = parseUserIntent(userMessage);
      const skipAI = ['help','lukeRevenue','lukePipeline','taliseStats','lastCounty','campaigns','community','analytics'].includes(intent);

      if (!skipAI) {
        const apiKey  = getApiKey();
        const response = await callAIFast(
          buildSystemPrompt(),
          newMessages.map(({ role, content }) => ({ role, content })),
          apiKey
        );
        const navMatch = response.match(/\[NAVIGATE:([\w-]+)\]/);
        if (navMatch) actions.navigate(navMatch[1]);
        const clean = response.replace(/\[NAVIGATE:[\w-]+\]/, '').trim();
        setMessages([...newMessages, { role: 'assistant', content: clean }]);
      } else {
        if (intent === 'navigate') {
          const pageMap = { dashboard:'dashboard', financing:'financing', 'film financing':'financing', productions:'productions', music:'music', agents:'agents', settings:'settings' };
          const pageMatch = userMessage.match(/(?:go to|navigate|open)\s+(?:the\s+)?(.+)/i);
          if (pageMatch) actions.navigate(pageMap[pageMatch[1].toLowerCase().trim()] || pageMatch[1].toLowerCase().trim());
        }
        setMessages([...newMessages, { role: 'assistant', content: getQuickResponses(intent) }]);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Cut! Something went wrong. ${err.message?.includes('API') ? 'Check your OpenAI key in Settings.' : err.message || 'Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => { const msg = input.trim(); setInput(''); sendMessage(msg); };
  const handleQuickAction = (prompt) => sendMessage(prompt);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <>
      {/* ── Trigger (hidden when open) ── */}
      <TriggerButton onClick={() => setIsOpen(true)} isOpen={isOpen} />

      {/* ── Chat window ── */}
      <div className={`fixed bottom-6 right-6 w-96 h-[560px] rounded-2xl border border-zinc-700/60 shadow-2xl shadow-black/60 flex flex-col z-[9999] overflow-hidden transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
      }`}>

        {/* ── Header with cinematic background ── */}
        <div className="relative flex-shrink-0 overflow-hidden">
          {/* layered backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-blue-950/60 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(245,158,11,0.12),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_50%,rgba(59,130,246,0.08),transparent_60%)]" />
          {/* spotlight sweep */}
          <div className="absolute inset-0 bg-[conic-gradient(from_200deg_at_70%_50%,rgba(245,158,11,0.07)_0deg,transparent_40deg)]" />
          {/* film strip left */}
          <div className="absolute left-0 top-0 bottom-0 w-5 flex flex-col justify-around py-1.5 opacity-[0.18] pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="mx-0.5 h-3 bg-white rounded-[1px]" />)}
          </div>
          {/* film strip right */}
          <div className="absolute right-0 top-0 bottom-0 w-5 flex flex-col justify-around py-1.5 opacity-[0.18] pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="mx-0.5 h-3 bg-white rounded-[1px]" />)}
          </div>
          {/* decorative ring */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-amber-500/10 pointer-events-none" />

          {/* content */}
          <div className="relative z-10 flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {/* avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Clapperboard size={18} className="text-zinc-950" />
                </div>
                {/* live dot */}
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950 shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white">Studio AI</span>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                  <Film size={9} className="text-amber-400/70" />
                  MulBros Media OS · gpt-4o-mini
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/95">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                  <Clapperboard size={11} className="text-zinc-950" />
                </div>
              )}
              <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-zinc-950 font-medium rounded-br-sm shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clapperboard size={11} className="text-zinc-950" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800/80 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2.5">
                <Loader2 size={13} className="text-amber-400 animate-spin" />
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick actions + input ── */}
        <div className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800/80 p-3 space-y-2.5">
          {/* quick action chips */}
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
              <button key={label} onClick={() => handleQuickAction(prompt)} disabled={isLoading}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5
                  bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-40
                  border border-zinc-700/60 hover:border-amber-500/30
                  rounded-lg text-zinc-400 hover:text-zinc-200
                  transition-all duration-200">
                <Icon size={10} className="text-amber-400/80 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* input row */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your call sheet…"
                disabled={isLoading}
                className="w-full bg-zinc-800/80 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm
                  placeholder:text-zinc-600 border border-zinc-700/60
                  focus:outline-none focus:border-amber-500/50 focus:bg-zinc-800
                  transition-all disabled:opacity-50"
              />
            </div>
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all
                bg-gradient-to-br from-amber-500 to-yellow-400
                hover:from-amber-400 hover:to-yellow-300
                disabled:from-zinc-700 disabled:to-zinc-700
                shadow-md shadow-amber-500/20 hover:shadow-amber-500/40
                disabled:shadow-none">
              {isLoading
                ? <Loader2 size={16} className="animate-spin text-zinc-400" />
                : <Send size={15} className="text-zinc-950 disabled:text-zinc-500" />}
            </button>
          </div>

          {/* branding footer */}
          <p className="text-[10px] text-zinc-700 text-center flex items-center justify-center gap-1">
            <Film size={9} className="text-zinc-700" />
            MulBros Studio AI · Powered by OpenAI
          </p>
        </div>
      </div>
    </>
  );
};
