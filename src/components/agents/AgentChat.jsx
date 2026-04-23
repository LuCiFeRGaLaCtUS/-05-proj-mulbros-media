import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Send, Loader2, Zap, Cpu, RotateCcw, Search, Globe, MessageCircle } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { getAgentById } from '../../config/agents';
import { callAI, getApiKey, callApifyReddit, callFirecrawlSearch, formatRedditResults, callAISearch } from '../../utils/ai';
import { verticalColors } from '../../config/verticalColors';
import { useAgentChats } from '../../hooks/useAgentChats';
import { logger } from '../../lib/logger';
import { useAppContext } from '../../App';

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const AgentChat = ({ user, preselectedAgentId, onClose }) => {
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgentId || 'film-financing-discovery');
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  // 'reddit' → Apify Reddit scrape · 'web' → OpenAI general web search · 'off' → no search
  const [searchMode, setSearchMode] = useState(() => sessionStorage.getItem('agentchat.searchMode') || 'reddit');
  const messagesEndRef = useRef(null);

  const agent = getAgentById(selectedAgent) || getAgentById('film-financing-discovery');
  const vc    = verticalColors[agent?.vertical] || verticalColors.financing;

  const { profile } = useAppContext();
  const { messages, addMessage, clearHistory } = useAgentChats(profile?.id, selectedAgent);

  useEffect(() => {
    sessionStorage.setItem('agentchat.searchMode', searchMode);
  }, [searchMode]);

  // Auto-switch to 'web' if the selected agent has no subreddits configured
  useEffect(() => {
    if (searchMode === 'reddit' && agent?.searchEnabled && !agent.searchSubreddits) {
      setSearchMode('web');
    }
  }, [agent?.id, agent?.searchEnabled, agent?.searchSubreddits, searchMode]);

  useEffect(() => {
    if (preselectedAgentId && preselectedAgentId !== selectedAgent) {
      setSelectedAgent(preselectedAgentId);
    }
  }, [preselectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const switchAgent = useCallback((id) => {
    setSelectedAgent(id);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input;
    setInput('');
    setIsLoading(true);

    // Optimistic user message (hook handles the DB insert)
    await addMessage('user', userContent);

    try {
      // Client-side key optional — server injects its own from env when present.
      // Proxy returns 401 only when BOTH server and client keys are missing.
      const apiKey = getApiKey(agent.model);

      // Build message history
      const apiMessages = [...messages, { role: 'user', content: userContent }]
        .map(({ role, content }) => ({ role, content }));

      // ── Web mode: bypass agent persona, render search output directly ────────
      // Prevents the agent LLM from re-narrating / fabricating on top of real results.
      // IMPORTANT: agent.systemPrompt is often Reddit-scoped ("site:reddit.com…" queries).
      // OpenAI web_search has shallow Reddit coverage → that prompt produces zero results.
      // In web mode we use a broad research prompt that keeps the agent's *topic* (vertical)
      // but drops any site restrictions so the search tool can hit news, gov, industry pubs.
      if (agent.searchEnabled && searchMode === 'web') {
        const today = new Date().toISOString().slice(0, 10);
        const webPrompt = [
          `You are the "${agent.name}" research agent inside MulBros Media OS (vertical: ${agent.vertical}).`,
          `Topic focus: ${agent.description}.`,
          `Today's date: ${today}.`,
          '',
          'BEHAVIOR:',
          '- You MUST call the web_search tool to answer. Do not claim you searched if you did not.',
          '- Run 2–4 different search queries. Vary the terms — try industry news, LinkedIn posts, filmmaker blogs, trade forums, YouTube interviews, Twitter/X threads, podcast transcripts. Not only Reddit.',
          '- Only cite URLs the tool actually returned. Never fabricate URLs, names, quotes, or details.',
          '- Stay in character as the named agent. Never identify as "SearchGPT", "an AI assistant", or any other persona.',
          '',
          'CRITICAL — WHEN USER ASKS FOR "N FILMMAKERS / PEOPLE / LEADS":',
          '- Each item MUST be a NAMED INDIVIDUAL PERSON (real first + last name, or real username/handle), not a state program, a policy debate, a think-tank report, or a news organization.',
          '- Each item MUST include: the person\'s name, their role (director/producer/etc), a direct paraphrase or quote of what THEY said about the topic, and the URL where you found it.',
          '- Policy news ≠ filmmaker discussion. If the tool only returns state-program announcements and think-tank reports, do NOT pad them as "filmmakers discussing X". Report honestly: "Search returned N policy/news articles but no individual filmmaker discussions. Named people I could identify: [list actual count]."',
          '- If user asked for 10 and you found 3 real named people with direct quotes, say "I found 3, not 10" — then list the 3. Honest < padded.',
          '',
          'OUTPUT FORMAT per lead:',
          '**[N]. [Full Name] — [Role / company if known]**',
          'Said: [direct quote or close paraphrase of their statement]',
          'Source: [URL]',
          'Date: [YYYY-MM-DD if known]',
          '',
          'If user asked for general research (not a list of people), give a concise sourced answer with inline links. Never pad.',
        ].join('\n');
        try {
          const webData = await callAISearch(userContent, webPrompt);
          const citeLines = (webData.citations || [])
            .map((c, i) => `[${i + 1}] [${c.title || c.url}](${c.url})`)
            .join('\n');
          const rendered = citeLines
            ? `${webData.text}\n\n---\n**Sources**\n${citeLines}`
            : webData.text;
          await addMessage('assistant', rendered);
        } catch (aiErr) {
          logger.warn('AgentChat.search.aiSearchUnavailable', {
            message: aiErr.message,
            status:  aiErr.status,
          });
          await addMessage(
            'assistant',
            `Web search produced no verified sources for: "${userContent}".\n\nReason: ${aiErr.message || 'upstream error'}.\n\nTry a more specific query, switch to **Reddit** mode, or disable search.`,
          );
        }
        return; // skip /api/ai second pass
      }

      // ── Reddit mode: Firecrawl primary (fast, Google-indexed) → Apify fallback ──
      if (agent.searchEnabled && searchMode === 'reddit' && agent.searchSubreddits) {
        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        let searchContext = null;
        let searchNote    = null;

        const hasRealResults = (data) => Array.isArray(data?.posts) && data.posts.length > 0;

        // Primary: Firecrawl (~2s, Google-indexed Reddit)
        try {
          const firecrawlData = await callFirecrawlSearch(userContent, agent.searchSubreddits);
          if (hasRealResults(firecrawlData)) {
            searchContext = formatRedditResults(firecrawlData);
          } else {
            throw new Error('Firecrawl returned 0 results');
          }
        } catch (firecrawlErr) {
          logger.warn('AgentChat.search.firecrawlUnavailable', {
            message: firecrawlErr.message,
            status:  firecrawlErr.status,
          });
          // Fallback: Apify deep scrape (~40s, headless browser)
          try {
            const apifyData = await callApifyReddit(userContent, agent.searchSubreddits);
            if (hasRealResults(apifyData)) {
              searchContext = formatRedditResults(apifyData);
              searchNote = 'Search via Apify (Firecrawl unavailable)';
            } else {
              throw new Error('Apify returned 0 results');
            }
          } catch (apifyErr) {
            logger.warn('AgentChat.search.apifyUnavailable', {
              message: apifyErr.message,
              status:  apifyErr.status,
            });
            searchNote = 'Reddit scrape returned no data (both Firecrawl and Apify)';
          }
        }

        const last = apiMessages[apiMessages.length - 1];
        if (searchContext) {
          const prefix = searchNote ? `[Note: ${searchNote}]\n\n` : '';
          apiMessages[apiMessages.length - 1] = {
            ...last,
            content: `[Today is ${today}]\n\n${prefix}${searchContext}\n\n---\n\nUser request: ${last.content}`,
          };
        } else {
          apiMessages[apiMessages.length - 1] = {
            ...last,
            content: `[Today is ${today}. ${searchNote} — do NOT invent usernames, URLs, or post details. Tell the user the scrape returned nothing and suggest switching to Web mode.]\n\n${last.content}`,
          };
        }
      }

      const response = await callAI(agent.systemPrompt, apiMessages, apiKey, agent.model);
      await addMessage('assistant', response);
    } catch (error) {
      logger.error('AgentChat.send.failed', error);
      toast.error(error.message || 'Failed to get response from agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt) => { setInput(prompt); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex -mx-6 -mt-6 h-[calc(100vh-4rem)]">
      <AgentSelector selectedAgent={selectedAgent} onSelectAgent={switchAgent} />

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#F7F7FA' }}>

        {/* Agent header bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 relative"
          style={{
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Bottom neon line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${vc.neon}30, transparent)` }} />

          <div className="flex items-center gap-3">
            {/* Agent avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm relative"
              style={{
                background: vc.dim,
                border: `1px solid ${vc.neon}35`,
                color: vc.ink,
                boxShadow: `0 0 14px ${vc.neon}20`,
              }}>
              {initials(agent.name)}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)', border: '1.5px solid #ffffff' }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900">{agent.name}</h2>
                <span className="chip" style={{
                  background: `${vc.neon}14`,
                  color: vc.ink,
                  border: `1px solid ${vc.neon}40`,
                  fontSize: '11px',
                }}>
                  ONLINE
                </span>
                {agent.searchEnabled && (
                  <span className="flex items-center gap-1 chip" style={{
                    background: `${vc.neon}14`,
                    color: vc.ink,
                    border: `1px solid ${vc.neon}40`,
                    fontSize: '11px',
                  }}>
                    <Search size={7} /> LIVE SEARCH
                  </span>
                )}
              </div>
              <p className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.66)' }}>
                {messages.length > 0 ? `${messages.length} messages · Neural link active` : 'Ready for input'}
              </p>
            </div>
          </div>

          {/* Clear button */}
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              title="Clear conversation"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
              style={{
                background: 'rgba(0,0,0,0.025)',
                border: '1px solid rgba(0,0,0,0.07)',
                color: 'rgba(0,0,0,0.66)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.color = 'rgba(0,0,0,0.66)'; }}
            >
              <RotateCcw size={11} />
              Clear
            </button>
          )}
        </div>

        {/* ── Messages area ── */}
        <div
          className="flex-1 overflow-y-auto p-6"
          aria-live="polite"
          aria-label={`Chat with ${agent.name}`}
          style={{ backgroundSize: '24px 24px' }}
        >
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="h-full flex flex-col justify-center items-center">
              {/* Large avatar */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${vc.neon}10 0%, transparent 70%)` }} />
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black relative"
                  style={{
                    background: `linear-gradient(135deg, ${vc.dim}, rgba(0,0,0,0.03))`,
                    border: `1px solid ${vc.neon}30`,
                    color: vc.ink,
                    boxShadow: `0 0 30px ${vc.neon}15, 0 8px 32px rgba(0,0,0,0.1)`,
                  }}>
                  {initials(agent.name)}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.9)', border: '2px solid #ffffff' }} />
                </div>
              </div>

              <h2 className="text-xl font-black mb-1" style={{ color: vc.ink }}>
                {agent.name}
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8" style={{ background: `${vc.neon}50` }} />
                <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.62)' }}>
                  Neural Agent Online
                </span>
                <div className="h-px w-8" style={{ background: `${vc.neon}50` }} />
              </div>

              <p className="text-sm text-center max-w-sm mb-8 leading-relaxed" style={{ color: 'rgba(0,0,0,0.72)' }}>
                {agent.description}
              </p>

              <SuggestedPrompts agentId={selectedAgent} onSelectPrompt={handlePromptSelect} />
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto w-full">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message._id ?? `msg-${index}`}
                  message={message}
                  agentName={agent.name}
                  vertical={agent.vertical}
                />
              ))}
              {isLoading && <TypingIndicator agentName={agent.name} vertical={agent.vertical} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div className="flex-shrink-0 p-4 relative"
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderTop: '1px solid rgba(0,0,0,0.07)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-4 right-4 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${vc.neon}20, transparent)` }} />

          {/* Search-mode toggle — only for search-enabled agents */}
          {agent.searchEnabled && (
            <div className="max-w-3xl mx-auto w-full mb-2 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">Search mode:</span>
              <div className="inline-flex rounded-lg border border-zinc-200 bg-white overflow-hidden" role="radiogroup" aria-label="Search mode">
                {[
                  { id: 'reddit', label: 'Reddit', Icon: MessageCircle, disabled: !agent.searchSubreddits },
                  { id: 'web',    label: 'Web (OpenAI)',   Icon: Globe,         disabled: false },
                  { id: 'off',    label: 'No search',      Icon: Cpu,           disabled: false },
                ].map(({ id, label, Icon, disabled }) => {
                  const active = searchMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={disabled || isLoading}
                      onClick={() => setSearchMode(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: active ? `${vc.neon}18` : 'transparent',
                        color:      active ? vc.ink        : 'rgba(0,0,0,0.60)',
                        borderRight: id !== 'off' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                      }}
                      title={disabled ? 'This agent has no Reddit subreddits configured' : label}
                    >
                      <Icon size={11} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 max-w-3xl mx-auto w-full">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}…`}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all"
                style={{
                  background: '#ffffff',
                  border: input ? `1px solid ${vc.neon}50` : '1px solid rgba(0,0,0,0.12)',
                  color: '#18181b',
                  outline: 'none',
                  boxShadow: input ? `0 0 0 3px ${vc.neon}06, 0 0 16px ${vc.neon}08` : 'none',
                }}
                rows={2}
                disabled={isLoading}
              />
              {/* Character hint */}
              {input.length > 200 && (
                <span className="absolute bottom-2 right-3 text-xs font-mono"
                  style={{ color: 'rgba(0,0,0,0.60)' }}>
                  {input.length}
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="rounded-xl px-4 transition-all flex items-center justify-center font-bold"
              style={{
                background: (!input.trim() || isLoading)
                  ? 'rgba(0,0,0,0.04)'
                  : `linear-gradient(135deg, ${vc.neon}22 0%, ${vc.neon}10 100%)`,
                border: (!input.trim() || isLoading)
                  ? '1px solid rgba(0,0,0,0.09)'
                  : `1px solid ${vc.neon}35`,
                color: (!input.trim() || isLoading) ? 'rgba(0,0,0,0.55)' : vc.ink,
                boxShadow: (!input.trim() || isLoading) ? 'none' : `0 0 16px ${vc.neon}15`,
              }}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {isLoading && agent.searchEnabled && searchMode !== 'off' ? (
                <>
                  <Search size={9} style={{ color: vc.ink }} className="animate-pulse" />
                  <span className="text-xs font-mono" style={{ color: vc.ink }}>
                    {searchMode === 'reddit' ? 'Searching Reddit (Firecrawl → Apify)…' : 'Searching web via OpenAI…'}
                  </span>
                </>
              ) : (
                <>
                  <Cpu size={9} style={{ color: '#0e7490' }} />
                  <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.66)' }}>
                    Enter to send · Shift+Enter new line
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
