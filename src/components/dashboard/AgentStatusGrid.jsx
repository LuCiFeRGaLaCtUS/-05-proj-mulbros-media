import React from 'react';
import { agents } from '../../config/agents';
import { Bot, ArrowRight } from 'lucide-react';

const verticalBadgeMap = {
  financing: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  film: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  music: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  composer: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  community: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
  strategy: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
};

const verticalLabelMap = {
  financing: 'Film Financing',
  film: 'Film',
  music: 'Music',
  composer: 'Composer',
  community: 'Community',
  strategy: 'Strategy'
};

export const AgentStatusGrid = ({ onAgentClick }) => {
  return (
    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 shadow-xl shadow-black/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-100">Agent Fleet</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {agents.length} agents online
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-zinc-800/30 border-b border-zinc-800/40">
        <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Agent</div>
        <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Vertical</div>
        <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Focus</div>
        <div className="col-span-1" />
      </div>

      {/* Agent rows */}
      <div className="divide-y divide-zinc-800/40">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="w-full grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors text-left group"
          >
            {/* Agent name + status */}
            <div className="col-span-5 flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
                {agent.name}
              </span>
            </div>

            {/* Vertical badge */}
            <div className="col-span-2 flex items-center">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verticalBadgeMap[agent.vertical]}`}>
                {verticalLabelMap[agent.vertical]}
              </span>
            </div>

            {/* Description */}
            <div className="col-span-4 flex items-center min-w-0">
              <span className="text-xs text-zinc-500 truncate">{agent.description}</span>
            </div>

            {/* Arrow */}
            <div className="col-span-1 flex items-center justify-end">
              <ArrowRight
                size={14}
                className="text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
