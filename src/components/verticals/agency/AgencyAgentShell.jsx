import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight } from 'lucide-react';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

/**
 * Shared shell for Agency views that wrap an agent.
 */
export const AgencyAgentShell = ({
  title, description, Icon,
  accentClass = 'text-violet-600',
  agentId, agentLabel = 'Open Agent',
  children, features = [], comingSoon = [],
}) => {
  const navigate = useNavigate();
  const handleOpenAgent = () => {
    if (agentId) sessionStorage.setItem('agentchat.preselectedAgent', agentId);
    navigate('/agents');
  };
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className={accentClass} size={20} />}
            <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
          </div>
          {description && <p className="text-sm text-zinc-500 max-w-2xl">{description}</p>}
        </div>
        <button onClick={handleOpenAgent}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 text-amber-300 text-sm font-semibold hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 border border-amber-500/20 whitespace-nowrap">
          <Bot size={14} />
          {agentLabel}
          <ArrowRight size={14} />
        </button>
      </div>
      {children}
      {features.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            What this agent can do
          </div>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accentClass.replace('text-', 'bg-')}`} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {comingSoon.length > 0 && (
        <div className="bg-zinc-50 rounded-2xl p-5 border border-dashed border-zinc-300">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Coming next sprints
          </div>
          <ul className="space-y-1.5 text-sm text-zinc-600">
            {comingSoon.map((f, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-zinc-400 mt-1">○</span>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
