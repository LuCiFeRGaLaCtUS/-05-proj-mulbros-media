import React from 'react';
import { getAgentById } from '../../config/agents';

const verticalColors = {
  financing: { hover: 'hover:border-blue-500/40 hover:bg-blue-500/5',    dot: 'bg-blue-400'    },
  film:      { hover: 'hover:border-emerald-500/40 hover:bg-emerald-500/5', dot: 'bg-emerald-400' },
  music:     { hover: 'hover:border-amber-500/40 hover:bg-amber-500/5',   dot: 'bg-amber-400'   },
  composer:  { hover: 'hover:border-amber-500/40 hover:bg-amber-500/5',   dot: 'bg-amber-400'   },
  community: { hover: 'hover:border-purple-500/40 hover:bg-purple-500/5', dot: 'bg-purple-400'  },
  strategy:  { hover: 'hover:border-rose-500/40 hover:bg-rose-500/5',     dot: 'bg-rose-400'    },
};

export const SuggestedPrompts = ({ agentId, onSelectPrompt }) => {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  const vc = verticalColors[agent.vertical] || verticalColors.financing;

  return (
    <div className="p-4 w-full max-w-lg">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Suggested prompts</h3>
      <div className="grid grid-cols-2 gap-2">
        {(agent.suggestedPrompts || []).map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className={`relative text-left p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 ${vc.hover} transition-all group overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-start gap-2">
              <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${vc.dot} opacity-60`} />
              <p className="text-sm text-zinc-300 group-hover:text-zinc-100 line-clamp-2 transition-colors">{prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
