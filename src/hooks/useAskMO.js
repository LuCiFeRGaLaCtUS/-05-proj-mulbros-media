import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { useChatSessions } from './useChatSessions';

/**
 * useAskMO — open the chat-first MO conversation with an optional prefilled prompt.
 *
 * Replaces the legacy `sessionStorage('agentchat.prefill') + navigate('/agents')`
 * pattern used by vertical CTAs before the chat-first migration. Creates a fresh
 * chat session and routes to /chat/:id, auto-sending the prompt via the
 * `initialPrompt` navigation state that ChatThread consumes.
 *
 * @param {string} [prompt]  natural-language prompt to auto-send.
 * @param {string} [slash]   optional slash command (e.g. 'income', 'tour') that
 *   routeToAgent resolves to a specialist agent. Prepended as `/slash `.
 * @returns {(prompt?: string, slash?: string) => Promise<void>}
 */
export const useAskMO = () => {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const { createSession } = useChatSessions(profile?.id, { skipLoad: true });

  return useCallback(async (prompt, slash) => {
    let text = (prompt || '').trim();
    if (slash) {
      const cmd = String(slash).replace(/^\//, '');
      text = text ? `/${cmd} ${text}` : `/${cmd}`;
    }
    const title = text ? text.replace(/^\/\S+\s*/, '').slice(0, 60) || 'New chat' : 'New chat';
    const s = await createSession(title);
    if (s?.id) {
      navigate(`/chat/${s.id}`, text ? { state: { initialPrompt: text } } : undefined);
    } else {
      navigate('/');
    }
  }, [profile?.id, createSession, navigate]);
};

export default useAskMO;
