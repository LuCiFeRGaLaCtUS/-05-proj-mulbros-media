import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Send, Loader2, Zap, Cpu, RotateCcw } from 'lucide-react';
import { AgentSelector } from './AgentSelector';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { SuggestedPrompts } from './SuggestedPrompts';
import { getAgentById } from '../../config/agents';
import { callAI, getApiKey } from '../../utils/ai';
import { verticalColors } from '../../config/verticalColors';

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// M19: persist chat history per agent in sessionStorage (cleared when tab closes)
const HISTORY_KEY = (id) => `mulbros_chat_${id}`;
const loadHistory = (id) => {
  try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY(id)) || '[]'); } catch { return []; }
};
const saveHistory = (id, msgs) => {
  try { sessionStorage.setItem(HISTORY_KEY(id), JSON.stringify(msgs)); } catch {}
};

export const AgentChat = ({ preselectedAgentId, onClose }) => {
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgentId || 'film-financing-discovery');
  const [messages, setMessages]           = useState(() => loadHistory(preselectedAgentId || 'film-financing-discovery'));
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const messagesEndRef = useRef(null);

  const agent = getAgentById(selectedAgent) || getAgentById('film-financing-discovery');
  const vc    = verticalColors[agent?.vertical] || verticalColors.financing;

  // Persist history whenever messages change
  useEffect(() => {
    saveHistory(selectedAgent, messages);
  }, [selectedAgent, messages]);

  useEffect(() => {
    if (preselectedAgentId && preselectedAgentId !== selectedAgent) {
      setSelectedAgent(preselectedAgentId);
      setMessages(loadHistory(preselectedAgentId));
    }
  }, [preselectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const switchAgent = useCallback((id) => {
    setSelectedAgent(id);
    setMessages(loadHistory(id));
  }, []);

  const clearHistory = () => {
    setMessages([]);
    saveHistory(selectedAgent, []);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings → API Keys and paste your OpenAI key.');
      }
      const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
      const response    = await callAI(agent.systemPrompt, apiMessages, apiKey, agent.model);
      setMessages([...newMessages, { role: 'assistant', content: response, timestamp: now() }]);
    } catch (error) {
      toast.error(error.message || 'Failed to get response from agent');
      setMessages(newMessages);
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
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#050509' }}>

        {/* Agent header bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 relative"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(7,7,14,0.8)',
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
                color: vc.neon,
                boxShadow: `0 0 14px ${vc.neon}20`,
              }}>
              {initials(agent.name)}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)', border: '1.5px solid #050509' }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100">{agent.name}</h2>
                <span className="chip" style={{
                  background: `${vc.neon}10`,
                  color: `${vc.neon}90`,
                  border: `1px solid ${vc.neon}20`,
                  fontSize: '8px',
                }}>
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              <RotateCcw size={11} />
              Clear
            </button>
          )}
        </div>

        {/* ── Messages area ── */}
        <div
          className="flex-1 overflow-y-auto p-6 bg-dot-grid"
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
                    background: `linear-gradient(135deg, ${vc.dim}, rgba(255,255,255,0.02))`,
                    border: `1px solid ${vc.neon}30`,
                    color: vc.neon,
                    boxShadow: `0 0 30px ${vc.neon}15, 0 8px 32px rgba(0,0,0,0.4)`,
                  }}>
                  {initials(agent.name)}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.9)', border: '2px solid #050509' }} />
                </div>
              </div>

              <h2 className="text-xl font-black mb-1" style={{ color: vc.neon }}>
                {agent.name}
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8" style={{ background: `${vc.neon}30` }} />
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Neural Agent Online
                </span>
                <div className="h-px w-8" style={{ background: `${vc.neon}30` }} />
              </div>

              <p className="text-sm text-center max-w-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {agent.description}
              </p>

              <SuggestedPrompts agentId={selectedAgent} onSelectPrompt={handlePromptSelect} />
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto w-full">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
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
            background: 'rgba(7,7,14,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-4 right-4 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${vc.neon}20, transparent)` }} />

          <div className="flex gap-3 max-w-3xl mx-auto w-full">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}…`}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: input ? `1px solid ${vc.neon}30` : '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                  boxShadow: input ? `0 0 0 3px ${vc.neon}06, 0 0 16px ${vc.neon}08` : 'none',
                }}
                rows={2}
                disabled={isLoading}
              />
              {/* Character hint */}
              {input.length > 200 && (
                <span className="absolute bottom-2 right-3 text-[10px] font-mono"
                  style={{ color: 'rgba(255,255,255,0.2)' }}>
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
                  ? 'rgba(255,255,255,0.04)'
                  : `linear-gradient(135deg, ${vc.neon}22 0%, ${vc.neon}10 100%)`,
                border: (!input.trim() || isLoading)
                  ? '1px solid rgba(255,255,255,0.06)'
                  : `1px solid ${vc.neon}35`,
                color: (!input.trim() || isLoading) ? 'rgba(255,255,255,0.2)' : vc.neon,
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
              <Cpu size={9} style={{ color: 'rgba(34,211,238,0.4)' }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
                Enter to send · Shift+Enter new line
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
