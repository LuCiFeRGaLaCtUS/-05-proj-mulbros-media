import React from 'react';
import { ExternalLink, Bot, Send } from 'lucide-react';
import { TiltCard } from '../../ui/TiltCard';
import { useAppContext } from '../../../App';
import { getAgentById } from '../../../config/agents';

export const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const AmberBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 blur-xl rounded-full pointer-events-none" />
  </>
);

export const StatLabel = ({ children, Icon }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)' }}
    className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5"
  >
    {Icon && <Icon size={10} />}
    {children}
  </div>
);

export const StatNumber = ({ children }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
    className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums"
  >
    {children}
  </div>
);

export const KpiCard = ({ label, value, Icon }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <StatLabel Icon={Icon}>{label}</StatLabel>
      <StatNumber>{value}</StatNumber>
    </div>
  </div>
);

export const VerticalHeader = ({ Icon, title, subtitle, chips = [] }) => (
  <TiltCard tiltLimit={6} scale={1.015} perspective={1400}
    className="tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
    <div className="relative z-10">
      <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
        {Icon && <Icon size={22} className="text-amber-600" />}
        {title}
      </h1>
      <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{subtitle}</p>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {chips.filter(Boolean).map((c, i) => (
            <span key={i} className={i === 0
              ? 'text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium'
              : 'text-xs bg-white border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium'}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  </TiltCard>
);

export const ToolsPanel = ({ tools, title = 'Recommended platforms' }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <StatLabel>{title}</StatLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map(t => (
          <a key={t.name} href={t.url} target="_blank" rel="noreferrer"
            className="group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
              <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
            </div>
            <div className="text-xs text-zinc-500 leading-snug">{t.desc}</div>
          </a>
        ))}
      </div>
    </div>
  </div>
);

export const AgentTab = ({ agentId }) => {
  const { setPreselectedAgent, navigate } = useAppContext();
  const agent = getAgentById(agentId);

  const open = (prompt) => {
    setPreselectedAgent(agentId);
    if (prompt) sessionStorage.setItem('agentchat.prefill', prompt);
    navigate('/agents');
  };

  if (!agent) {
    return <div className="tile-pop bg-white rounded-2xl p-6 text-center" style={CARD_STYLE}>
      <p className="text-sm text-zinc-500">Agent not configured.</p>
    </div>;
  }

  return (
    <div className="space-y-5 animate-hud-in">
      <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
        <AmberBg />
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
              <Bot size={22} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-zinc-900">{agent.name}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed mt-1 max-w-2xl">{agent.description}</p>
            </div>
            <button onClick={() => open()}
              className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0">
              <Bot size={12} /> Open Chat
            </button>
          </div>
          <StatLabel>Suggested prompts</StatLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(agent.suggestedPrompts || []).map(p => (
              <button key={p} onClick={() => open(p)}
                className="text-left group relative bg-white rounded-xl p-3 border border-zinc-200 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-zinc-700 leading-snug">{p}</span>
                  <Send size={12} className="text-zinc-400 group-hover:text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
