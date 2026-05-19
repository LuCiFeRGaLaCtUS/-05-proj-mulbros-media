import React, { useState } from 'react';
import { Radar, Search, Sparkles } from 'lucide-react';
import { AgencyAgentShell } from './AgencyAgentShell';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const QUICK_QUERIES = [
  { label: 'Drama leads NY', prompt: 'Find indie drama features casting leads in NY this month' },
  { label: 'Streaming pilots', prompt: 'What streaming pilots got greenlit with open roles for fall 2026?' },
  { label: 'Period piece', prompt: 'Productions casting period-piece actors for streaming projects right now' },
  { label: 'Commercial scale', prompt: 'Show 5 commercial castings paying SAG scale this week' },
  { label: 'Horror Atlanta', prompt: 'Indie horror features casting in Atlanta in next 60 days' },
  { label: 'Voiceover work', prompt: 'Animated series + game VO castings currently open' },
];

export const CastingFeedView = () => {
  const [query, setQuery] = useState('');

  const fire = (prompt) => {
    sessionStorage.setItem('agentchat.prefill', prompt);
    sessionStorage.setItem('agentchat.preselectedAgent', 'agency-opportunity-scout');
    sessionStorage.setItem('agentchat.searchMode.v2', 'web');
    window.location.href = '/agents';
  };

  return (
    <AgencyAgentShell
      title="Casting Feed"
      description="Live opportunity scout via web search. Surfaces casting calls, project announcements, deadlines. Backstage / Actors Access / Casting Networks API integration ships Sprint 4."
      Icon={Radar}
      agentId="agency-opportunity-scout"
      agentLabel="Open Scout"
      features={[
        'Live casting calls (paid + union) matching your roster profile',
        'Cross-reference roster skills against incoming castings',
        'Flag tight deadlines (<48 hrs)',
        'Whisper-network: project announcements, pilots greenlit, films greenlit',
        'Casting director patterns (genres they cast, scale vs over-scale)',
      ]}
      comingSoon={[
        'Backstage paid API direct feed (Sprint 4)',
        'Actors Access OAuth integration (Sprint 4)',
        'Casting Networks integration (Sprint 4)',
        'Auto-match roster talents to incoming castings + bulk-submit',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Search className="text-violet-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Scout opportunities</div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">web search</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && query.trim() && fire(query)}
            placeholder="e.g. Find indie features casting drama leads in NY this month"
            className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <button onClick={() => query.trim() && fire(query)}
            disabled={!query.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
              query.trim() ? 'bg-violet-500 text-white hover:bg-violet-600' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            <Sparkles size={14} /> Scout
          </button>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          Quick queries
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {QUICK_QUERIES.map(q => (
            <button key={q.label} onClick={() => fire(q.prompt)}
              className="text-left p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-violet-300 transition">
              <div className="text-xs font-bold text-zinc-900 mb-0.5">{q.label}</div>
              <div className="text-[11px] text-zinc-500 truncate">{q.prompt}</div>
            </button>
          ))}
        </div>
      </div>
    </AgencyAgentShell>
  );
};
