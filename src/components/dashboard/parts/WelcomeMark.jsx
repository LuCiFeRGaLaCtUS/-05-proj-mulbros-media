import React from 'react';
import { Film, Play, ArrowRight } from 'lucide-react';
import { agents as allAgents } from '../../../config/agents';
import { TiltCard } from '../../ui/TiltCard';

export const WelcomeMark = ({ onGoToAgents }) => {
  const activeCount = allAgents.filter(a => a.status === 'active').length;
  return (
  <TiltCard
    tiltLimit={6} scale={1.015} perspective={1400}
    className="tile-pop bg-white rounded-2xl h-full"
    style={{
      minHeight: 290,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    }}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-amber-50/30 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
    <div className="absolute left-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.06] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-zinc-400 rounded-[2px]" />)}
    </div>
    <div className="absolute right-0 top-0 bottom-0 w-7 flex flex-col justify-around py-2 opacity-[0.06] pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="mx-1 h-4 bg-zinc-400 rounded-[2px]" />)}
    </div>

    <div className="relative z-10 px-10 py-8 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Film size={13} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.20em]"
            style={{ fontFamily: 'var(--font-sans)' }}>Studio Command Center</span>
        </div>
        <p className="text-zinc-700 text-base mb-0.5 font-medium" style={{ letterSpacing: '-0.01em' }}>Welcome back,</p>
        <h2 className="font-display font-extrabold leading-[0.95] mb-3"
          style={{
            fontSize: '3.2rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #18181b 0%, #f59e0b 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          MulBros Media
        </h2>
        <p className="text-zinc-600 text-sm leading-relaxed max-w-xs">
          Your AI-powered Hollywood OS is live.<br />
          <span className="text-amber-600 font-semibold">{activeCount} agents</span> active ·{' '}
          <span className="text-blue-600 font-semibold">$214K</span> pipeline ·{' '}
          <span className="text-emerald-600 font-semibold">3 verticals</span>
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        {[
          { label: 'Film Financing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Productions',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Music & Comp.', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(({ label, color }) => (
          <span key={label} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${color}`}
            style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
        ))}
      </div>

      <button onClick={onGoToAgents}
        className="self-start inline-flex items-center gap-2 mt-5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl px-5 py-2.5 transition-all group/btn active:scale-95 shadow-sm shadow-amber-500/20"
        style={{ fontFamily: 'var(--font-sans)' }}>
        <Play size={13} className="group-hover/btn:scale-110 transition-transform" />
        Open Agent Hub
        <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
      </button>
    </div>
  </TiltCard>
  );
};
