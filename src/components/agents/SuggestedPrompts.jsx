import React from 'react';
import { getAgentById } from '../../config/agents';

export const SuggestedPrompts = ({ agentId, onSelectPrompt }) => {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Suggested prompts</h3>
      <div className="grid grid-cols-2 gap-2">
        {agent.suggestedPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 hover:border-amber-500/30 transition-all"
          >
            <p className="text-sm text-zinc-300 line-clamp-2">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};