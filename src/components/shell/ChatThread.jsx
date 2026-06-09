import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../App';
import { usePersona } from '../../lib/personaState';
import { useChatSessions } from '../../hooks/useChatSessions';
import { useSessionMessages } from '../../hooks/useSessionMessages';
import { routeToAgent } from '../../lib/personaRouter';
import { callAI, getApiKey } from '../../utils/ai';
import { toOpenAITools } from '../../config/tools';
import { ChatMessage, TypingIndicator } from '../agents/ChatMessage';
import { MOAvatar } from './MOAvatar';
import { ChatBar } from './ChatBar';

/**
 * ChatThread — centered conversation view.
 * Sessions live in ChatShell sidebar Recents — no left rail here.
 */
export const ChatThread = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAppContext();
  const { persona, setState: setPersonaState } = usePersona();

  const { createSession, touchSession } = useChatSessions(profile?.id, { skipLoad: true });
  const { messages, appendMessage } = useSessionMessages(profile?.id, sessionId);

  const [sending, setSending] = useState(false);
  const [pinnedAgentId] = useState(null); // future: support session-pinned agent
  const scrollRef = useRef(null);
  const handledInitialRef = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || !profile?.id) return;
    setSending(true);
    setPersonaState('thinking');

    // Ensure session exists
    let sid = sessionId;
    if (!sid) {
      const s = await createSession(text.slice(0, 60));
      if (!s?.id) {
        setSending(false);
        setPersonaState('idle');
        toast.error('Could not create chat.');
        return;
      }
      sid = s.id;
      navigate(`/chat/${sid}`, { replace: true });
    }

    // Persist user message
    await appendMessage('user', text, sid);

    // Route to correct agent
    const { agent, systemPrompt, allowedTools } = routeToAgent(text, pinnedAgentId);

    // Build API message history (last 20 to keep tokens sane)
    const history = [...messages, { role: 'user', content: text }].slice(-20).map(m => ({
      role:    m.role,
      content: m.content,
    }));

    const apiKey = getApiKey(agent.model || 'gpt-4o');
    // Build tools array: undefined allowedTools = all tools (MO); [] = none
    const tools = allowedTools === undefined
      ? toOpenAITools()                     // all
      : (allowedTools.length > 0 ? toOpenAITools(allowedTools) : []);
    try {
      const result = await callAI(
        systemPrompt, history, apiKey, agent.model || 'gpt-4o',
        tools.length > 0 ? { tools } : undefined,
      );
      const reply     = typeof result === 'string' ? result : (result?.content || '');
      const toolCalls = typeof result === 'string' ? []     : (result?.toolCalls || []);
      // Encode each executed tool call as a fenced ```toolcall block — ChatMessage
      // parses these and renders a formatted result card (not raw JSON).
      const toolBlocks = toolCalls.length > 0
        ? '\n\n' + toolCalls.map(c => {
            const payload = JSON.stringify({
              name:   c.name,
              ok:     c.result?.ok !== false,
              args:   c.args || {},
              result: c.result ?? null,
            });
            return '```toolcall\n' + payload + '\n```';
          }).join('\n')
        : '';
      await appendMessage('assistant', (reply || (toolCalls.length ? 'Done.' : '')) + toolBlocks, sid);
      await touchSession(sid);
    } catch (err) {
      const msg = err?.userMessage || err?.message || 'AI request failed.';
      await appendMessage('assistant', `⚠️ ${msg}`, sid);
      toast.error(msg);
    } finally {
      setSending(false);
      setPersonaState('idle');
    }
  }, [profile?.id, sessionId, messages, pinnedAgentId, createSession, navigate, appendMessage, touchSession, setPersonaState]);

  // Handle initial prompt passed via navigation state (from ChatHome).
  // Declared after handleSend so it's in scope (no TDZ / use-before-define).
  useEffect(() => {
    if (handledInitialRef.current) return;
    const initial = location.state?.initialPrompt;
    if (initial && sessionId && profile?.id) {
      handledInitialRef.current = true;
      handleSend(initial);
      // Clear state so reload doesn't re-fire
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, profile?.id, location.state, handleSend]);

  const handleNewChat = async () => {
    const s = await createSession('New chat');
    if (s?.id) navigate(`/chat/${s.id}`);
    else       navigate('/');
  };

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'flex', flexDirection: 'column',
      background: '#F5F6F8',
      overflow: 'hidden',
    }}>
      {/* Thread header */}
      <div style={{
        height: 56,
        padding: '0 24px',
        borderBottom: '1px solid #E0E0E0',
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MOAvatar size={28} state={sending ? 'thinking' : 'idle'} />
          <div>
            <div style={{
              fontWeight: 700, fontSize: 14, color: '#0B1D3A',
              fontFamily: "'Inter Tight', sans-serif", letterSpacing: '-0.01em',
            }}>
              {persona.name || 'MO'}
            </div>
            <div style={{
              fontSize: 11, color: '#888',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999,
                background: sending ? '#0F6E56' : '#5DCAA5',
              }} />
              {sending ? 'thinking…' : 'online'}
            </div>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            color: '#0B1D3A',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.length === 0 && !sending && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, padding: 32, color: '#888',
            }}>
              <MOAvatar size={64} state="idle" />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Say hi to {persona.name || 'MO'}</div>
              <div style={{ fontSize: 12 }}>Type below — slash commands available with /</div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage
              key={m._id}
              message={m}
              agentName={persona.name || 'MO'}
            />
          ))}

          {sending && (
            <TypingIndicator agentName={persona.name || 'MO'} />
          )}
        </div>
      </div>

      {/* Sticky composer */}
      <div style={{
        borderTop: '1px solid #E0E0E0',
        background: '#FFFFFF',
        padding: '16px 24px 20px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <ChatBar
            onSend={handleSend}
            sending={sending}
            autoFocus
            onIntegrations={() => navigate('/settings')}
            placeholder={`Message ${persona.name || 'MO'}…`}
          />
          <div style={{
            marginTop: 8, fontSize: 11, color: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <AlertCircle size={11} />
            MO can make mistakes — verify high-stakes decisions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
