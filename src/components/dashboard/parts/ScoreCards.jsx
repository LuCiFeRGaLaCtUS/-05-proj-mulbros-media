import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { BgAudienceScore, BgDealFlow } from './backgrounds';
import { C } from './constants';

export const AudienceScore = ({ onClick }) => {
  const r = 52, circ = 2 * Math.PI * r, dash = circ * 0.95;
  return (
    <button onClick={onClick}
      className="tile-pop relative w-full text-left rounded-2xl p-5 h-full flex flex-col overflow-hidden cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fffdf5 45%, #ffffff 75%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgAudienceScore />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Audience Score</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Across all releases</p>
        </div>
        <ExternalLink size={12} className="text-zinc-600 group-hover:text-amber-500 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center py-2">
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/[0.06] blur-2xl pointer-events-none" />
        <div className="relative">
          <svg width="144" height="144" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
            <circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" stroke="url(#scoreGrad)"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Star size={15} className="text-amber-500" fill="#f59e0b" />
            <span className="text-2xl font-black text-zinc-900 leading-none" style={{ fontFamily: 'var(--font-sans)' }}>95%</span>
            <span className="text-xs text-zinc-500">rating</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-100 grid grid-cols-3 text-center">
        <div><p className="text-xs text-zinc-600">Low</p><p className="text-xs font-bold text-zinc-600">0%</p></div>
        <div><p className="text-xs text-zinc-500">Based on</p><p className="text-xs font-bold text-amber-600">likes</p></div>
        <div><p className="text-xs text-zinc-600">High</p><p className="text-xs font-bold text-zinc-600">100%</p></div>
      </div>
    </button>
  );
};

export const DealFlow = ({ onClick }) => {
  const r = 36, circ = 2 * Math.PI * r, dash = circ * 0.70;
  return (
    <button onClick={onClick}
      className="tile-pop relative w-full text-left rounded-2xl p-5 h-full flex flex-col overflow-hidden cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgDealFlow />
      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Deal Flow</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Luke composer pipeline</p>
        </div>
        <ExternalLink size={12} className="text-zinc-600 group-hover:text-emerald-500 transition-colors mt-0.5" />
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-2 mb-4">
        {[{ label: 'Active Leads', value: '14' }, { label: 'Confirmed $', value: '$30K' }].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 hover:border-emerald-300 transition-colors">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-lg font-black text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="relative z-10 flex items-center gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={C.emerald} strokeWidth="7"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-zinc-900 leading-none" style={{ fontFamily: 'var(--font-sans)' }}>9.3</span>
            <span className="text-xs text-zinc-500 mt-0.5">score</span>
          </div>
        </div>
        <div className="space-y-2">
          <div><p className="text-xs text-zinc-500">Pipeline health</p><p className="text-sm font-bold text-emerald-600">Strong ↑</p></div>
          <div><p className="text-xs text-zinc-500">Echo Valley</p><p className="text-xs font-bold text-zinc-700">$35K negotiating</p></div>
          <div><p className="text-xs text-zinc-500">Saltwater</p><p className="text-xs font-bold text-zinc-700">$12K in progress</p></div>
        </div>
      </div>
      <div className="relative z-10 mt-3 pt-3 border-t border-zinc-100 flex justify-between text-xs text-zinc-600">
        <span>0%</span>
        <span className="text-emerald-600 font-bold text-xs">70% closed</span>
        <span>100%</span>
      </div>
    </button>
  );
};
