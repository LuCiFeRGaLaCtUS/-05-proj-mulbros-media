import React from 'react';
import { agents } from '../../config/agents';
import { Bot, ArrowRight } from 'lucide-react';

const verticalBadgeMap = {
  financing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  film: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  music: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  composer: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  community: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  strategy: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
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
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-zinc-500" />
          <h3 className="text-base font-semibold text-zinc-900">Agent Fleet</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {agents.length} agents online
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
        <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-zinc-600">Agent</div>
        <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Vertical</div>
        <div className="col-span-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Focus</div>
        <div className="col-span-1" />
      </div>

      {/* Agent rows */}
      <div className="divide-y divide-zinc-100">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="w-full grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors text-left group"
          >
            {/* Agent name + status */}
            <div className="col-span-5 flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-medium text-zinc-700 truncate group-hover:text-zinc-900 transition-colors">
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
                className="text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
