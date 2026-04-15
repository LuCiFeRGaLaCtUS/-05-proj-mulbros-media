import React from 'react';
import { Film, Music, Piano, Megaphone, Clapperboard, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const iconMap = {
  Film,
  Music,
  Piano,
  Megaphone,
  Clapperboard
};

const colorConfig = {
  blue: {
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    ring: 'hover:ring-blue-500/30',
    arrow: 'text-blue-400',
    badge: 'bg-emerald-500/10 text-emerald-400',
    badgeDown: 'bg-red-500/10 text-red-400'
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    ring: 'hover:ring-amber-500/30',
    arrow: 'text-amber-400',
    badge: 'bg-emerald-500/10 text-emerald-400',
    badgeDown: 'bg-red-500/10 text-red-400'
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    ring: 'hover:ring-emerald-500/30',
    arrow: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400',
    badgeDown: 'bg-red-500/10 text-red-400'
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    ring: 'hover:ring-purple-500/30',
    arrow: 'text-purple-400',
    badge: 'bg-emerald-500/10 text-emerald-400',
    badgeDown: 'bg-red-500/10 text-red-400'
  }
};

export const KPICard = ({ title, value, change, changeDirection, subtitle, icon, color, onClick }) => {
  const Icon = iconMap[icon] || Music;
  const cfg = colorConfig[color] || colorConfig.blue;
  const TrendIcon = changeDirection === 'up' ? TrendingUp : TrendingDown;
  const badgeClass = changeDirection === 'up' ? cfg.badge : cfg.badgeDown;
  const isClickable = !!onClick;

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
          <Icon size={18} className={cfg.iconColor} />
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>
          <TrendIcon size={11} />
          {change}
        </span>
      </div>

      <div className="text-3xl font-bold font-mono text-zinc-100 mb-1 tracking-tight">
        {value}
      </div>
      <div className="text-sm font-medium text-zinc-300 mb-0.5">{title}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{subtitle}</div>
        {isClickable && (
          <ArrowRight
            size={13}
            className={`opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${cfg.arrow}`}
          />
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={`group w-full text-left bg-zinc-900 rounded-2xl p-5 ring-1 ring-zinc-800 ${cfg.ring} shadow-xl shadow-black/30 transition-all duration-200 hover:scale-[1.01] cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="group bg-zinc-900 rounded-2xl p-5 ring-1 ring-zinc-800 hover:ring-zinc-700 shadow-xl shadow-black/30 transition-all duration-200">
      {content}
    </div>
  );
};
