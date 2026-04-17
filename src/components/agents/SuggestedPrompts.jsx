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
        <div className="h-px flex-1" style={{ background: `${vc.neon}20` }} />
        <div className="flex items-center gap-1.5">
          <Zap size={10} style={{ color: vc.neon, opacity: 0.6 }} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]"
            style={{ color: `${vc.neon}60` }}>
            Quick Start
          </span>
        </div>
        <div className="h-px flex-1" style={{ background: `${vc.neon}20` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(agent.suggestedPrompts || []).map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="relative text-left p-3 rounded-xl transition-all group overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = vc.dim;
              e.currentTarget.style.borderColor = `${vc.neon}25`;
              e.currentTarget.style.boxShadow = vc.glow ? vc.glow.replace('16px', '10px') : '';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Left indicator */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: vc.neon, boxShadow: `0 0 6px ${vc.neon}` }} />

            <div className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: vc.neon, opacity: 0.4 }} />
              <p className="text-xs leading-relaxed line-clamp-3 transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                {prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
