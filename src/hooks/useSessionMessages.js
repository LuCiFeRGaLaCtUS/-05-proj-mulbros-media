import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const useSessionMessages = (userId, sessionId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!userId || !sessionId) { setMessages([]); return; }
    setLoading(true);
    supabase
      .from('agent_chats')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) logger.error('useSessionMessages.load.failed', error);
        setMessages((data || []).map(r => ({
          role: r.role, content: r.content, _id: r.id, created_at: r.created_at,
        })));
        setLoading(false);
      });
  }, [userId, sessionId]);

  const appendMessage = useCallback(async (role, content, overrideSid) => {
    const sid = overrideSid || sessionId;
    if (!userId || !sid) return null;
    const optimistic = { role, content, _id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    const { data, error } = await supabase
      .from('agent_chats')
      .insert({ user_id: userId, agent_id: 'universal', session_id: sid, role, content })
      .select().single();
    if (!error && data) {
      setMessages(prev => prev.map(m => m._id === optimistic._id ? { role: data.role, content: data.content, _id: data.id, created_at: data.created_at } : m));
    } else if (error) {
      logger.error('useSessionMessages.insert.failed', error);
    }
    return data;
  }, [userId, sessionId]);

  return { messages, loading, appendMessage };
};
