import React, { useState } from 'react';
import { Mail, Inbox, Send } from 'lucide-react';
import { TalentAgentShell } from './TalentAgentShell';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const AgentInboxView = () => {
  const [mode, setMode] = useState('summarize'); // summarize | draft
  const [text, setText] = useState('');
  const askMO = useAskMO();

  const handleAsk = () => {
    if (!text.trim()) return;
    askMO(mode === 'summarize'
      ? `Summarize this email from my agent into key actions:\n\n${text}`
      : `Draft a reply email to my agent:\n\n${text}`, 'agent');
  };

  return (
    <TalentAgentShell
      title="Agent Intermediary"
      description="Drafts outbound emails to your agent. Summarizes inbound. Tracks offers + decision dates. Preps your monthly check-in calls."
      Icon={Mail}
      accentClass="text-sky-600"
      agentId="talent-agent-intermediary"
      agentLabel="Open Inbox"
      features={[
        'Draft emails to your agent (status updates, availability, callback feedback requests)',
        'Summarize inbound emails — extract offers, audition requests, advice, deadlines',
        'Track active offers with decision dates',
        'Counter-offer language when terms come in',
        'Prep for monthly state-of-career check-in calls',
      ]}
      comingSoon={[
        'Gmail OAuth — auto-archive all agent comms (Sprint 4)',
        'AI summary in inbox digest each morning',
        'Auto-draft replies awaiting your approval (HITL)',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center bg-zinc-100 rounded-lg p-1">
            <button onClick={() => setMode('summarize')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'summarize' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}>
              <Inbox size={12} className="inline mr-1" />
              Summarize inbound
            </button>
            <button onClick={() => setMode('draft')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'draft' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}>
              <Send size={12} className="inline mr-1" />
              Draft outbound
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'summarize'
            ? 'Paste the email from your agent here…'
            : 'What do you need to tell your agent? Describe the situation…'}
          rows={6}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400 mb-3"
        />
        <div className="flex justify-end">
          <button onClick={handleAsk}
            disabled={!text.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              text.trim()
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            {mode === 'summarize' ? 'Summarize' : 'Draft Reply'}
          </button>
        </div>
      </div>
    </TalentAgentShell>
  );
};
