import React from 'react';

export const MetricCard = ({ title, value, change, changeType }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <div className="text-sm text-zinc-400 mb-1">{title}</div>
      <div className="text-2xl font-bold font-mono text-zinc-100">{value}</div>
      {change && (
        <div className={`text-xs mt-1 ${
          changeType === 'positive' ? 'text-emerald-500' : 
          changeType === 'negative' ? 'text-red-500' : 'text-zinc-500'
        }`}>
          {change}
        </div>
      )}
    </div>
  );
};