import React from 'react';
import { MessageSquare } from 'lucide-react';

const columnConfig = {
  prospecting: { name: 'Prospecting', bg: 'bg-zinc-800' },
  pitched: { name: 'Pitched', bg: 'bg-blue-500/10' },
  negotiating: { name: 'Negotiating', bg: 'bg-amber-500/10' },
  closed: { name: 'Closed / Scoring', bg: 'bg-emerald-500/10' }
};

export const LeadPipeline = ({ pipeline, onAgentClick }) => {
  const columns = Object.keys(columnConfig);

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((columnId) => {
        const config = columnConfig[columnId];
        const deals = pipeline[columnId] || [];

        return (
          <div key={columnId} className={`${config.bg} rounded-xl p-4 min-h-[400px]`}>
            <h4 className="text-sm font-semibold text-zinc-100 mb-4">{config.name}</h4>
            <div className="space-y-3">
              {deals.map((deal, index) => (
                <div
                  key={index}
                  className="bg-zinc-800 rounded-lg p-4 border border-zinc-700/50 mb-3"
                >
                  <h5 className="text-sm font-semibold text-zinc-100 mb-1">
                    {deal.title}
                  </h5>
                  <p className="text-xs text-zinc-400 mb-2">Dir. {deal.director}</p>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-500">{deal.budget}</span>
                    <span className="text-zinc-500">{deal.genre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-zinc-700 rounded-full text-xs text-zinc-300">
                      {deal.state}
                    </span>
                    <button
                      onClick={() => onAgentClick('luke-sales')}
                      className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                      <MessageSquare size={12} />
                      Ask Agent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};