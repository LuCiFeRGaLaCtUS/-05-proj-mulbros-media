import React from 'react';
import { agentGroups } from '../../config/agents';

export const AgentSelector = ({ selectedAgent, onSelectAgent }) => {
  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Agents</h3>
      <div className="space-y-4">
        {agentGroups.map((group) => (
          <div key={group.name}>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">
              {group.name}
            </h4>
            <div className="space-y-1">
              {group.agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full rounded-lg p-3 cursor-pointer transition-all text-left ${
                    selectedAgent === agent.id
                      ? 'bg-amber-500/10 border border-amber-500/50'
                      : 'bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">{agent.name}</span>
                    <span className={`w-2 h-2 ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{agent.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};