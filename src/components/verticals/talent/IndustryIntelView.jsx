import React, { useState } from 'react';
import { TrendingUp, Search, Sparkles } from 'lucide-react';
import { TalentAgentShell } from './TalentAgentShell';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const QUICK_QUERIES = [
  { label: 'Casting heat', prompt: 'What roles are casting heavily this month in my region?' },
  { label: 'Rising directors', prompt: 'Who are 5 rising indie directors I should be on the radar of in horror/thriller?' },
  { label: 'Festival deadlines', prompt: 'What festival submission deadlines are coming in the next 60 days?' },
  { label: 'SAG status', prompt: 'What is the latest SAG-AFTRA negotiation / strike status?' },
  { label: 'Market gaps', prompt: 'What underrepresented roles or unmet demand exist in my region right now?' },
  { label: 'Workshop intel', prompt: 'Recommended acting workshops or intensives by reputable teachers running this quarter.' },
];

export const IndustryIntelView = () => {
  const [query, setQuery] = useState('');

  const fire = (prompt) => {
    sessionStorage.setItem('agentchat.prefill', prompt);
    sessionStorage.setItem('agentchat.preselectedAgent', 'talent-industry-intel');
    sessionStorage.setItem('agentchat.searchMode.v2', 'web');
    window.location.href = '/agents';
  };

  return (
    <TalentAgentShell
      title="Industry Intel"
      description="Live web search agent for casting news · rising directors · festival deadlines · union updates · market gaps. Cites sources."
      Icon={TrendingUp}
      accentClass="text-sky-600"
      agentId="talent-industry-intel"
      agentLabel="Open Intel"
      features={[
        'Live casting heat — who is hiring what, by region + genre',
        'Rising directors / showrunners / casting directors to follow',
        'Festival deadlines (SXSW, Tribeca, Sundance, Cannes, TIFF, etc.)',
        'Union news (SAG-AFTRA, Equity, AEA, ACTRA) — strike, residuals, scale changes',
        'Market gaps — underrepresented roles + unmet demand',
        'Acting workshops + intensives by reputable teachers',
      ]}
      comingSoon={[
        'Daily intel digest (push notification + email)',
        'Customized weekly briefing by your role profile',
        'Calendar export for festival deadlines',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Search className="text-sky-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Ask anything live-search-able</div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">web search</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && query.trim() && fire(query)}
            placeholder="e.g. Who is casting young-leading-man drama roles in Atlanta this month?"
            className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <button onClick={() => query.trim() && fire(query)}
            disabled={!query.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
              query.trim()
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            <Sparkles size={14} />
            Ask
          </button>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          Quick queries
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {QUICK_QUERIES.map(q => (
            <button key={q.label}
              onClick={() => fire(q.prompt)}
              className="text-left p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-sky-300 transition">
              <div className="text-xs font-bold text-zinc-900 mb-0.5">{q.label}</div>
              <div className="text-[11px] text-zinc-500 truncate">{q.prompt}</div>
            </button>
          ))}
        </div>
      </div>
    </TalentAgentShell>
  );
};
