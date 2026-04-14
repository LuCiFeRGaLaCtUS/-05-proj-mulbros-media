import React from 'react';
import { agents } from '../../config/agents';

const verticalColorMap = {
  film: 'bg-blue-500',
  music: 'bg-amber-500',
  composer: 'bg-emerald-500',
  community: 'bg-purple-500',
  strategy: 'bg-rose-500'
};

const verticalLabelMap = {
  film: 'Film',
  music: 'Music',
  composer: 'Composer',
  community: 'Community',
  strategy: 'Strategy'
};

export const AgentStatusGrid = ({ onAgentClick }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-lg shadow-black/20">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Agent Fleet</h3>
      <div className="grid grid-cols-4 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 hover:border-amber-500/30 hover:-translate-y-0.5 cursor-pointer transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-200 truncate">{agent.name}</span>
              <span className={`w-2 h-2 ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${verticalColorMap[agent.vertical]} bg-opacity-20 text-${verticalColorMap[agent.vertical].replace('bg-', '')}`}>
              {verticalLabelMap[agent.vertical]}
            </span>
            <p className="text-xs text-zinc-500 mt-2 truncate">
              {agent.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};