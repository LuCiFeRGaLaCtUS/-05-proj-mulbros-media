import React, { useState, useRef, useEffect } from 'react';
import { Users, Send, Plus, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../App';
import { useTeamChannels, useTeamMessages } from '../../hooks/useTeamChat';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const NewChannelInline = ({ userId, onCreated }) => {
  const [open,   setOpen]   = useState(false);
  const [name,   setName]   = useState('');
  const [busy,   setBusy]   = useState(false);

  const submit = async () => {
    if (!name.trim() || !userId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('team_channels').insert({
        owner_id:   userId,
        name:       name.trim(),
        type:       'group',
        member_ids: [userId],
      });
      if (error) { logger.error('TeamChat.create', error); return; }
      setName('');
      setOpen(false);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> New channel
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Channel name"
        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !name.trim()} className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium disabled:opacity-40">
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => { setOpen(false); setName(''); }} className="px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-zinc-900">
          Cancel
        </button>
      </div>
    </div>
  );
};

const ChannelRow = ({ channel, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
      active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-700 hover:bg-zinc-50'
    }`}
  >
    <div className="flex items-center gap-2">
      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
      <span className="text-sm font-medium truncate">{channel.name}</span>
    </div>
    <div className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider">
      {channel.type} · {(channel.member_ids || []).length} member{(channel.member_ids || []).length === 1 ? '' : 's'}
    </div>
  </button>
);

const MessageBubble = ({ msg, mine }) => (
  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${mine ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
      <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-zinc-500'}`} style={{ fontFamily: 'var(--font-mono)' }}>
        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
    </div>
  </div>
);

const Thread = ({ channelId, userId }) => {
  const { messages, loading, sending, send } = useTeamMessages(channelId, userId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    if (!draft.trim()) return;
    const ok = await send(draft);
    if (ok) setDraft('');
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400 text-center mt-6">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center mt-6">No messages yet — say hi.</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} mine={m.sender_id === userId} />)
        )}
      </div>
      <div className="border-t border-zinc-200 p-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
        />
        <button
          onClick={submit}
          disabled={sending || !draft.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-40"
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
};

export const TeamChatView = () => {
  const { profile } = useAppContext();
  const userId = profile?.id;
  const { channels, loading, reload } = useTeamChannels(userId);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!activeId && channels.length > 0) setActiveId(channels[0].id);
  }, [channels, activeId]);

  const active = channels.find((c) => c.id === activeId);

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-6 pt-6 pb-3">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1 flex items-center gap-2">
          <Users className="w-6 h-6" /> Team
        </h1>
        <p className="text-sm text-zinc-500">Realtime team chat · Supabase Realtime</p>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-6 min-h-0">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Channel list */}
          <aside className="col-span-3 bg-white rounded-2xl p-3 flex flex-col gap-2 min-h-0" style={CARD_STYLE}>
            <NewChannelInline userId={userId} onCreated={reload} />
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {loading ? (
                <p className="text-xs text-zinc-400 px-3 py-2">Loading…</p>
              ) : channels.length === 0 ? (
                <p className="text-xs text-zinc-400 px-3 py-4 text-center">No channels yet.</p>
              ) : (
                channels.map((c) => (
                  <ChannelRow key={c.id} channel={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
                ))
              )}
            </div>
          </aside>

          {/* Thread */}
          <main className="col-span-9 bg-white rounded-2xl flex flex-col min-h-0" style={CARD_STYLE}>
            {active ? (
              <>
                <div className="border-b border-zinc-200 px-6 py-3">
                  <h2 className="text-sm font-semibold text-zinc-900">{active.name}</h2>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    {active.type} · {(active.member_ids || []).length} member{(active.member_ids || []).length === 1 ? '' : 's'}
                  </p>
                </div>
                <Thread channelId={active.id} userId={userId} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
                Select or create a channel to start chatting.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TeamChatView;
