import React from 'react';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { useCountUp } from './useCountUp';

export const StatCardAnimated = ({ title, numericValue, formatter, change, changeUp, sub, Icon, iconBg, iconColor, accentColor, Bg, onClick, linkLabel, delay = 0, cardBg }) => {
  const counted = useCountUp(numericValue, 1400, delay);
  const display = formatter ? formatter(counted) : counted.toLocaleString();

  return (
    <button
      onClick={onClick}
      className="tile-pop relative w-full text-left rounded-2xl p-5 overflow-hidden group cursor-pointer"
      style={{
        background: cardBg || '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        '--accent': accentColor,
      }}
    >
      <Bg />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}>{title}</p>
          <p className="text-[1.65rem] font-bold text-zinc-900 leading-none mb-2 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>{display}</p>
          <div className="flex items-center gap-1.5">
            {changeUp
              ? <TrendingUp size={10} className="text-emerald-500 flex-shrink-0" />
              : <TrendingDown size={10} className="text-red-500 flex-shrink-0" />}
            <span className={`text-xs font-bold ${changeUp ? 'text-emerald-600' : 'text-red-500'}`}>{change}</span>
            {sub && <span className="text-xs text-zinc-600 ml-0.5">{sub}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ExternalLink size={10} className="text-zinc-600" />
        <span className="text-xs text-zinc-600">{linkLabel}</span>
      </div>
    </button>
  );
};

export const ProgressCard = ({ Icon, iconBg, iconColor, title, value, pct, color, sub, Bg, onClick, hoverRing, cardBg }) => (
  <button onClick={onClick}
    className={`tile-pop relative w-full text-left rounded-2xl ${hoverRing} p-5 overflow-hidden cursor-pointer group`}
    style={{ background: cardBg || '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <Bg />
    <div className="relative z-10 flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{title}</p>
        <p className="text-lg font-black text-zinc-900 leading-tight"
          style={{ fontFamily: 'var(--font-sans)' }}>{value}</p>
      </div>
      <ExternalLink size={11} className="text-zinc-500 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
    </div>
    <div className="relative z-10 space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{sub}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  </button>
);
