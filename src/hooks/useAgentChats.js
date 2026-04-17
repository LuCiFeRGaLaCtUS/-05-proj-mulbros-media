import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const useAgentChats = (userId, agentId) => {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!userId || !agentId) return;
    setLoading(true);
    setMessages([]);
    supabase
      .from('agent_chats')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at')
      .then(({ data }) => {
        // Shape to match component expectations: { role, content, timestamp }
        setMessages(
          (data || []).map(row => ({
            role:      row.role,
            content:   row.content,
            timestamp: formatTime(row.created_at),
            _id:       row.id,
          }))
        );
        setLoading(false);
      });
  }, [userId, agentId]);

  const addMessage = useCallback(async (role, content) => {
    const optimistic = { role, content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, optimistic]);

    const { data } = await supabase
      .from('agent_chats')
      .insert({ user_id: userId, agent_id: agentId, role, content })
      .select()
      .single();

    if (data) {
      // Replace optimistic entry with real row (adds _id)
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findLastIndex(m => m.role === role && m.content === content && !m._id);
        if (idx !== -1) updated[idx] = { ...updated[idx], _id: data.id };
        return updated;
      });
    }
  }, [userId, agentId]);

  const clearHistory = useCallback(async () => {
    await supabase.from('agent_chats').delete().eq('user_id', userId).eq('agent_id', agentId);
    setMessages([]);
  }, [userId, agentId]);

  return { messages, loading, addMessage, clearHistory };
};
