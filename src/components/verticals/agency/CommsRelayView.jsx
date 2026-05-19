import React, { useState } from 'react';
import { Inbox, Mail, Send } from 'lucide-react';
import { AgencyAgentShell } from './AgencyAgentShell';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const CommsRelayView = () => {
  const [mode, setMode] = useState('summarize');
  const [text, setText] = useState('');

  const handleAsk = () => {
    if (!text.trim()) return;
    const prompt = mode === 'summarize'
      ? `Summarize this email thread and identify action items + urgency:\n\n${text}`
      : `Draft a reply email from the agency. Pro-formal tone:\n\n${text}`;
    sessionStorage.setItem('agentchat.prefill', prompt);
    sessionStorage.setItem('agentchat.preselectedAgent', 'agency-comms-relay');
    window.location.href = '/agents';
  };

  return (
    <AgencyAgentShell
      title="Comms Relay"
      description="Unified inbox for casting director ↔ agency ↔ talent communications. Summarize inbound, draft outbound, route to right roster talent."
      Icon={Inbox}
      agentId="agency-comms-relay"
      agentLabel="Open Relay"
      features={[
        'Summarize inbound threads (who, what, action needed, deadline)',
        'Suggest reply drafts (HITL — never auto-send)',
        'Route casting director messages to right roster talent',
        'Flag urgent items (same-day audition, callback today, contract decision needed)',
        'Maintain thread context across multi-message conversations',
      ]}
      comingSoon={[
        'Gmail OAuth — auto-archive all agency comms (Sprint 4)',
        'Auto-draft replies awaiting approval (HITL queue)',
        'Slack/iMessage/WhatsApp routing (Sprint 4)',
        'Daily inbox digest (push notification)',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center bg-zinc-100 rounded-lg p-1">
            <button onClick={() => setMode('summarize')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'summarize' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}>
              <Inbox size={12} className="inline mr-1" /> Summarize inbound
            </button>
            <button onClick={() => setMode('draft')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'draft' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}>
              <Send size={12} className="inline mr-1" /> Draft outbound
            </button>
          </div>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'summarize'
            ? 'Paste an email or thread to summarize…'
            : 'What needs to go out? Describe the context, recipient, and tone…'}
          rows={6}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 mb-3" />
        <div className="flex justify-end">
          <button onClick={handleAsk}
            disabled={!text.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              text.trim() ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            {mode === 'summarize' ? 'Summarize' : 'Draft Reply'}
          </button>
        </div>
      </div>
    </AgencyAgentShell>
  );
};
