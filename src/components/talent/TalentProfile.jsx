import React from 'react';

export const TalentProfile = ({ name, subtitle, tags, metrics, color, isSelected, onClick }) => {
  const colorClasses = {
    amber: 'border-amber-500/20 from-amber-500/10',
    emerald: 'border-emerald-500/20 from-emerald-500/10'
  };

  const textColors = {
    amber: 'text-amber-500',
    emerald: 'text-emerald-500'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-br ${colorClasses[color] || colorClasses.amber} to-zinc-900 border rounded-xl p-6 cursor-pointer transition-all text-left ${
        isSelected
          ? `ring-2 ring-${color === 'amber' ? 'amber' : 'emerald'}-500`
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <h3 className={`text-2xl font-bold ${textColors[color] || textColors.amber} mb-1`}>{name}</h3>
      <p className="text-zinc-400 text-sm mb-3">{subtitle}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-zinc-800/50 rounded-full text-xs text-zinc-400">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <span className="text-lg font-mono font-bold text-zinc-200">{metric.value}</span>
            <span className="text-xs text-zinc-500 ml-1">{metric.label}</span>
          </div>
        ))}
      </div>
    </button>
  );
};