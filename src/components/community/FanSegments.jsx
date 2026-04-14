import React from 'react';
import { fanSegments } from '../../config/mockData';

export const FanSegments = () => {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Fan Segments</h3>
      <div className="space-y-2">
        {fanSegments.map((segment, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full bg-${segment.color}-500`}></span>
              <span className="text-sm font-medium text-zinc-200">{segment.name}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-zinc-400">{segment.size.toLocaleString()}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                segment.engagement === 'Very High' ? 'bg-emerald-500/20 text-emerald-500' :
                segment.engagement === 'High' ? 'bg-blue-500/20 text-blue-500' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {segment.engagement}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};