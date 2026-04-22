import React, { useState, useEffect } from 'react';
import { VERTICALS } from '../../../config/verticals';
import { UI } from '../../../constants';
import { WeatherTile } from './WeatherTile';

export const WelcomeHero = ({ user, profile }) => {
  const [liveNow, setLiveNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setLiveNow(new Date()), UI.timeUpdateMs);
    return () => clearInterval(id);
  }, []);

  const greeting = () => {
    const h = liveNow.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = liveNow.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = liveNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const stytchFirstName = user?.name?.first_name?.trim();
  const emailPrefix     = (user?.emails?.[0]?.email || '').split('@')[0].split('.')[0];
  const rawFirst        = stytchFirstName || emailPrefix || 'there';
  const firstName       = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      <div className="lg:col-span-7 relative rounded-2xl overflow-hidden tile-pop"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          minHeight: 220,
        }}>

        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-10 right-20 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)' }} />

        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.45) 35%, rgba(34,211,238,0.2) 65%, transparent)' }} />

        <div className="absolute inset-0 bg-dot-grid opacity-50 pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: 220 }}>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full online-dot"
                  style={{ color: '#22d3ee', background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: '#0e7490', fontFamily: 'var(--font-sans)' }}>
                  {greeting()} · Studio Active
                </span>
              </div>

              <h1 className="font-display leading-[1.15] mb-0"
                style={{
                  color: 'rgba(12,10,9,0.70)',
                  fontSize: '2.6rem',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  letterSpacing: '0.005em',
                }}>
                Welcome back,
              </h1>
              <h1 className="font-display leading-[1.0]"
                style={{
                  background: 'linear-gradient(105deg, #d97706 0%, #f59e0b 40%, #fbbf24 70%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: '4.8rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}>
                {firstName}.
              </h1>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#22d3ee', boxShadow: '0 0 5px rgba(34,211,238,0.9)' }} />
                <span className="font-mono text-xl font-black tabular-nums"
                  style={{ color: 'rgba(8,145,178,0.9)', letterSpacing: '-0.02em' }}>
                  {timeStr}
                </span>
              </div>
              <span className="font-mono text-xs font-bold tabular-nums" style={{ color: 'rgba(0,0,0,0.62)', letterSpacing: '-0.01em' }}>
                {dateStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(() => {
              const vertInfo = profile?.vertical
                ? VERTICALS.find(v => v.id === profile.vertical)
                : null;
              return [
                { label: 'Studio Online',                                    color: '#22d3ee' },
                { label: '9 Agents Active',                                  color: '#34d399' },
                { label: '$214K Pipeline',                                   color: '#f59e0b' },
                { label: vertInfo ? `${vertInfo.label} · Active`
                                  : '3 Verticals Live',                      color: vertInfo?.neon || '#a78bfa' },
              ];
            })().map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: `${color}0d`,
                  border: `1px solid ${color}28`,
                }}>
                <div className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-xs font-semibold tracking-wide"
                  style={{ color: `${color}ee`, fontFamily: 'var(--font-sans)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <WeatherTile />
      </div>
    </div>
  );
};
