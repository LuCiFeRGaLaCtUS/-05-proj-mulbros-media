import React from 'react';
import { fanSegments } from '../../config/mockData';

export const FanSegments = () => {
  return (
    <div className="relative bg-zinc-900 rounded-xl p-6 border border-purple-900/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-500/10 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-purple-500 rounded-full" />
          <h3 className="text-sm font-semibold text-zinc-200">Fan Segments</h3>
        </div>
        <div className="space-y-2">
          {fanSegments.map((segment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer border border-transparent hover:border-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full bg-${segment.color}-500`}></span>
                <span className="text-sm font-medium text-zinc-200">{segment.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-zinc-400 font-mono">{segment.size.toLocaleString()}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  segment.engagement === 'Very High' ? 'bg-emerald-500/15 text-emerald-400' :
                  segment.engagement === 'High' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {segment.engagement}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
