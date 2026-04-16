import React from 'react';

export const MetricCard = ({ title, value, change, changeType }) => {
  return (
    <div className="relative bg-zinc-900 rounded-xl p-5 border border-amber-900/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="text-sm text-zinc-400 mb-1">{title}</div>
        <div className="text-2xl font-bold font-mono text-zinc-100">{value}</div>
        {change && (
          <div className={`text-xs mt-1 ${
            changeType === 'positive' ? 'text-emerald-400' :
            changeType === 'negative' ? 'text-red-400' : 'text-zinc-500'
          }`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};
