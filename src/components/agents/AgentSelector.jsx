import React from 'react';
import { agentGroups } from '../../config/agents';

const verticalColors = {
  financing: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    ring: 'border-blue-500/50',    dot: 'bg-blue-400'    },
  film:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'border-emerald-500/50', dot: 'bg-emerald-400' },
  music:     { bg: 'bg-amber-500/15',   text: 'text-amber-400',   ring: 'border-amber-500/50',   dot: 'bg-amber-400'   },
  composer:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   ring: 'border-amber-500/50',   dot: 'bg-amber-400'   },
  community: { bg: 'bg-purple-500/15',  text: 'text-purple-400',  ring: 'border-purple-500/50',  dot: 'bg-purple-400'  },
  strategy:  { bg: 'bg-rose-500/15',    text: 'text-rose-400',    ring: 'border-rose-500/50',    dot: 'bg-rose-400'    },
};

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const AgentSelector = ({ selectedAgent, onSelectAgent }) => {
  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
      <div className="px-4 py-4 border-b border-zinc-800/60 flex-shrink-0">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Agents</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {agentGroups.map((group) => (
            <div key={group.name}>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                {group.name}
              </h4>
              <div className="space-y-1">
                {group.agents.map((agent) => {
                  const vc = verticalColors[agent.vertical] || verticalColors.financing;
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      className={`w-full rounded-xl p-3 cursor-pointer transition-all text-left border ${
                        isSelected
                          ? `${vc.bg} ${vc.ring}`
                          : 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          isSelected ? `${vc.bg} ${vc.text}` : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {initials(agent.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                              {agent.name}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              agent.status === 'active' ? `${vc.dot} animate-pulse` : 'bg-zinc-600'
                            }`} />
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-snug line-clamp-1">{agent.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
