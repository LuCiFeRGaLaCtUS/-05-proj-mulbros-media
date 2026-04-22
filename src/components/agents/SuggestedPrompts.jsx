import React from 'react';
import { Zap } from 'lucide-react';
import { getAgentById } from '../../config/agents';
import { verticalColors } from '../../config/verticalColors';

export const SuggestedPrompts = ({ agentId, onSelectPrompt }) => {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  const vc = verticalColors[agent.vertical] || verticalColors.financing;

  return (
    <div className="w-full max-w-lg px-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1" style={{ background: `${vc.neon}40` }} />
        <div className="flex items-center gap-1.5">
          <Zap size={10} style={{ color: vc.ink }} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]"
            style={{ color: vc.ink }}>
            Quick Start
          </span>
        </div>
        <div className="h-px flex-1" style={{ background: `${vc.neon}40` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(agent.suggestedPrompts || []).map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="relative text-left p-3 rounded-xl transition-all group overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.10)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = vc.dim;
              e.currentTarget.style.borderColor = `${vc.neon}55`;
              e.currentTarget.style.boxShadow = vc.glow ? vc.glow.replace('16px', '10px') : '';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
            }}
          >
            {/* Left indicator */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: vc.neon, boxShadow: `0 0 6px ${vc.neon}` }} />

            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: vc.ink }} />
              <p className="text-xs leading-relaxed line-clamp-3 text-zinc-700">
                {prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
