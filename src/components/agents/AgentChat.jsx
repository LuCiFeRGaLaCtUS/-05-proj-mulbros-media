import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Send, Loader2, Plus, MessageSquare, Trash2, Bot, Sparkles,
  Globe, MessageCircle, Cpu, Search, X, Pencil, Check, ListTree, ChevronRight,
} from 'lucide-react';
import { AgentPlan } from '../ui/AgentPlan';
import { AIPromptBox } from '../ui/AIPromptBox';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { getAgentById } from '../../config/agents';
import {
  callAI, getApiKey, callApifyReddit, callFirecrawlSearch,
  formatRedditResults, callAISearch,
} from '../../utils/ai';
import { useAppContext } from '../../App';
import { useChatSessions } from '../../hooks/useChatSessions';
import { useSessionMessages } from '../../hooks/useSessionMessages';
import { logger } from '../../lib/logger';

const AGENT_ID_DEFAULT = 'universal';

const relTime = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
};

export const AgentChat = ({ preselectedAgentId }) => {
  const { profile, preselectedAgent, setPreselectedAgent } = useAppContext();
  const agentId = preselectedAgentId || preselectedAgent || AGENT_ID_DEFAULT;
  const agent   = getAgentById(agentId) || getAgentById(AGENT_ID_DEFAULT);

  const { sessions, createSession, renameSession, touchSession, deleteSession } = useChatSessions(profile?.id);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(() => sessionStorage.getItem('agentchat.searchMode.v2') || 'web');
  const [renameOpen, setRenameOpen] = useState(null);
  const [showPlan, setShowPlan]     = useState(false);
  const messagesEndRef = useRef(null);

  const { messages, appendMessage } = useSessionMessages(profile?.id, activeSessionId);

  // Initial: open most recent or start fresh
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) setActiveSessionId(sessions[0].id);
  }, [sessions, activeSessionId]);

  // Prefill from sessionStorage (triggered by vertical agent tabs)
  useEffect(() => {
    const pref = sessionStorage.getItem('agentchat.prefill');
    if (pref) {
      setInput(pref);
      sessionStorage.removeItem('agentchat.prefill');
    }
  }, []);

  useEffect(() => { sessionStorage.setItem('agentchat.searchMode.v2', searchMode); }, [searchMode]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const newChat = async () => {
    const s = await createSession('New chat');
    if (s) setActiveSessionId(s.id);
    setPreselectedAgent?.(null);
  };

  const send = async (explicitText) => {
    const raw  = explicitText != null ? explicitText : input;
    const text = (raw || '').trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    try {
      // Ensure we have a session; auto-create on first message
      let sid = activeSessionId;
      let titleUpdate = null;
      if (!sid) {
        const s = await createSession(text.slice(0, 48));
        if (!s) throw new Error('Could not create chat');
        sid = s.id;
        setActiveSessionId(sid);
      } else {
        // If session is still "New chat" and this is the first message, retitle from query
        const current = sessions.find(x => x.id === sid);
        if (current && current.title === 'New chat' && messages.length === 0) {
          titleUpdate = text.slice(0, 48);
        }
      }

      await appendMessage('user', text, sid);

      // Build message history (post-append is async; include optimistic state)
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      // Optional live search (reuses existing cascade)
      if (searchMode !== 'off') {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const hasPosts = (d) => Array.isArray(d?.posts) && d.posts.length > 0;
        const hasText  = (d) => typeof d?.text === 'string' && d.text.trim().length > 0;

        let ctx = null;
        if (searchMode === 'reddit') {
          try {
            const subs = agent.searchSubreddits || ['indiefilm','filmmakers','WeAreTheMusicMakers','Screenwriting','ArtistLounge'];
            const data = await callFirecrawlSearch(text, subs);
            if (hasPosts(data)) ctx = formatRedditResults(data);
            else throw new Error('firecrawl empty');
          } catch {
            try {
              const subs = agent.searchSubreddits || ['indiefilm','filmmakers','WeAreTheMusicMakers','Screenwriting','ArtistLounge'];
              const data = await callApifyReddit(text, subs);
              if (hasPosts(data)) ctx = formatRedditResults(data);
            } catch (err) { logger.warn('AgentChat.search.reddit.failed', err); }
          }
        } else if (searchMode === 'web') {
          try {
            const data = await callAISearch(text, `${agent.systemPrompt}\n\nUse web_search for current info. Today: ${today}.`);
            if (hasText(data)) {
              const cites = (data.citations || []).map((c, i) => `[${i+1}] ${c.title || c.url} — ${c.url}`).join('\n');
              ctx = `[Web search results]\n${data.text}\n\n${cites}\n[End search]`;
            }
          } catch (err) { logger.warn('AgentChat.search.web.failed', err); }
        }

        if (ctx) {
          apiMessages[apiMessages.length - 1] = {
            role: 'user',
            content: `[Today: ${today}]\n\n${ctx}\n\n---\n\nUser: ${text}`,
          };
        }
      }

      const apiKey = getApiKey(agent.model);
      const systemWithMode =
        `${agent.systemPrompt}\n\nCURRENT SEARCH MODE: ${searchMode}. ` +
        (searchMode === 'off'
          ? 'Live search is OFF for this message. Do NOT claim to search, do NOT say "please hold", "let me check", "I\'ll look that up". Answer from your training data only. If the user needs live/current data, tell them plainly: "Live search is off — toggle Web or Reddit in the composer and resend."'
          : searchMode === 'web'
            ? 'The web_search has already completed BEFORE your reply runs. Its results and citations are embedded above in the user message. Use them, cite the URLs. Do not claim you will search — you already did.'
            : 'Reddit scrape has already completed BEFORE your reply runs. Real posts are embedded above. Use those posts and their URLs. Do not claim you will search — you already did.');
      const response = await callAI(systemWithMode, apiMessages, apiKey, agent.model);
      await appendMessage('assistant', response, sid);
      touchSession(sid);
      if (titleUpdate) renameSession(sid, titleUpdate);
    } catch (err) {
      logger.error('AgentChat.send.failed', err);
      toast.error(err.message || 'Failed to send');
    } finally {
      setIsLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex -mx-6 -mt-6 h-[calc(100vh-4rem)] bg-zinc-50">
      {/* ── Sessions sidebar ─────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-3 border-b border-zinc-200">
          <button onClick={newChat}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
            <Plus size={14} /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-8 px-4">No chats yet. Start a new conversation.</div>
          )}
          {sessions.map(s => {
            const active = s.id === activeSessionId;
            const isRenaming = renameOpen === s.id;
            return (
              <div key={s.id}
                className={`group relative rounded-lg text-sm transition-colors ${active ? 'bg-amber-50 text-amber-900' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                {isRenaming ? (
                  <form onSubmit={e => { e.preventDefault(); const v = e.target.title.value.trim(); if (v) renameSession(s.id, v); setRenameOpen(null); }}
                    className="flex items-center gap-1 px-2 py-2">
                    <input name="title" defaultValue={s.title} autoFocus
                      className="flex-1 text-sm bg-white border border-amber-400 rounded px-2 py-1 focus:outline-none" />
                    <button type="submit" className="text-emerald-600 p-1"><Check size={13} /></button>
                    <button type="button" onClick={() => setRenameOpen(null)} className="text-zinc-500 p-1"><X size={13} /></button>
                  </form>
                ) : (
                  <button onClick={() => setActiveSessionId(s.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left">
                    <MessageSquare size={13} className={active ? 'text-amber-700' : 'text-zinc-400'} />
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{relTime(s.last_message_at)}</span>
                  </button>
                )}
                {!isRenaming && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-inherit">
                    <button onClick={() => setRenameOpen(s.id)} className="p-1 rounded hover:bg-white/60 text-zinc-500 hover:text-amber-700" title="Rename"><Pencil size={11} /></button>
                    <button onClick={() => { if (confirm('Delete this chat?')) deleteSession(s.id); }}
                      className="p-1 rounded hover:bg-white/60 text-zinc-500 hover:text-red-600" title="Delete"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-zinc-200 text-[10px] text-zinc-500 flex items-center gap-1.5">
          <Bot size={11} className="text-amber-600" /> {agent.name}
        </div>
      </div>

      {/* ── Conversation pane ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
              <Bot size={15} className="text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900">{agent.name}</h2>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ONLINE</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">{messages.length} messages</p>
            </div>
          </div>
          <button onClick={() => setShowPlan(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              showPlan ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Agent plan">
            <ListTree size={12} /> Plan <ChevronRight size={11} className={`transition-transform ${showPlan ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" aria-live="polite">
          {!activeSessionId || messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-4">
                <Bot size={28} className="text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">{agent.name}</h3>
              <p className="text-sm text-zinc-600 mb-6 max-w-md leading-relaxed">{agent.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                {(agent.suggestedPrompts || []).map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="text-left text-sm bg-white border border-zinc-200 hover:border-amber-500/50 rounded-lg px-3 py-2 text-zinc-700 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto w-full">
              {messages.map(m => (
                <ChatMessage
                  key={m._id}
                  message={{ ...m, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                  agentName={agent.name}
                  vertical={agent.vertical}
                />
              ))}
              {isLoading && <TypingIndicator agentName={agent.name} vertical={agent.vertical} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-zinc-200">
          {/* Search mode toggle */}
          <div className="max-w-3xl mx-auto w-full">
            <AIPromptBox
              isLoading={isLoading}
              placeholder="Message MulBros Assistant…"
              searchMode={searchMode}
              onSearchModeChange={setSearchMode}
              initialValue={input}
              onSend={(text /*, files */) => send(text)}
            />
            <div className="text-[10px] text-zinc-400 font-mono text-center mt-2">
              {isLoading && searchMode !== 'off' ? (
                <span className="flex items-center justify-center gap-1"><Search size={9} className="animate-pulse" /> {searchMode === 'reddit' ? 'Searching Reddit…' : 'Searching web…'}</span>
              ) : (
                'Enter to send · Shift+Enter for newline'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right rail: Agent Plan ────────────────────────────────────────── */}
      {showPlan && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-200 bg-zinc-50 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2">
              <ListTree size={14} className="text-amber-600" />
              <span className="text-sm font-bold text-zinc-900">Agent Plan</span>
            </div>
            <button onClick={() => setShowPlan(false)} className="text-zinc-400 hover:text-zinc-700"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto">
            <AgentPlan tasks={DEMO_PLAN} />
          </div>
        </div>
      )}
    </div>
  );
};

// Demo plan data — wire to real agent orchestration when backend provides steps.
const DEMO_PLAN = [
  {
    id: '1', title: 'Understand user request', status: 'completed', priority: 'high', dependencies: [],
    subtasks: [
      { id: '1.1', title: 'Parse query intent', status: 'completed', description: 'Identified target vertical + outcome', tools: ['intent-classifier'] },
      { id: '1.2', title: 'Load profile context', status: 'completed', description: 'Pulled onboarding answers + past chats' },
    ],
  },
  {
    id: '2', title: 'Gather live data', status: 'in-progress', priority: 'high', dependencies: ['1'],
    subtasks: [
      { id: '2.1', title: 'Search Reddit via Firecrawl', status: 'completed', tools: ['firecrawl'] },
      { id: '2.2', title: 'Search Web via OpenAI', status: 'in-progress', tools: ['openai-web-search'] },
      { id: '2.3', title: 'Deduplicate + rank results', status: 'pending' },
    ],
  },
  {
    id: '3', title: 'Draft response', status: 'pending', priority: 'medium', dependencies: ['2'],
    subtasks: [
      { id: '3.1', title: 'Cite every source', status: 'pending' },
      { id: '3.2', title: 'Apply agent voice', status: 'pending' },
    ],
  },
];
