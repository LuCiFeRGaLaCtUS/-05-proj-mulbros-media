import React from 'react';
import { Film, Music, Piano } from 'lucide-react';

const iconMap = {
  Film,
  Music,
  Piano
};

const colorMap = {
  blue: 'border-l-4 border-l-blue-500',
  amber: 'border-l-4 border-l-amber-500',
  emerald: 'border-l-4 border-l-emerald-500'
};

export const KPICard = ({ title, value, change, changeDirection, subtitle, icon, color }) => {
  const Icon = iconMap[icon] || Music;
  const colorClass = colorMap[color] || '';

  return (
    <div className={`bg-zinc-900 rounded-xl p-5 border border-zinc-800 ${colorClass} shadow-lg shadow-black/20`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-zinc-400" />
        <span className="text-sm text-zinc-400">{title}</span>
      </div>
      <div className="text-3xl font-bold font-mono text-zinc-100 mb-2">
        {value}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          changeDirection === 'up' ? 'text-emerald-500' : 'text-red-500'
        }`}>
          {change}
        </span>
        <span className="text-xs text-zinc-500">{subtitle}</span>
      </div>
    </div>
  );
};