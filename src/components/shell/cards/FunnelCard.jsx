import React from 'react';
import { DashCard } from './DashCard';

/**
 * FunnelCard — real audition funnel (Total → Callbacks → Booked).
 * Built from useAuditions counts passed by ChatHome. No mock data:
 * when there are zero auditions it renders an honest empty state.
 *
 * Props:
 *   counts — { total, submitted, callback, booked, pass, no_response }
 *   locked — day-gate
 *   onLearnMore
 */
export const FunnelCard = ({ counts, locked, onLearnMore }) => {
  const total = counts?.total || 0;
  const reachedCallback = (counts?.callback || 0) + (counts?.booked || 0);
  const booked = counts?.booked || 0;

  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const stages = [
    { label: 'Auditions', value: total,           pct: 100,                   color: '#D5DCE6' },
    { label: 'Callbacks', value: reachedCallback, pct: pct(reachedCallback),  color: '#3E8C76' },
    { label: 'Booked',    value: booked,          pct: pct(booked),           color: '#0F6E56' },
  ];

  return (
    <DashCard
      title="Audition funnel"
      locked={locked}
      lockedHint="Unlocks Day 2"
      onLearnMore={total > 0 ? onLearnMore : undefined}
    >
      {total === 0 ? (
        <div style={{
          height: '100%', minHeight: 110,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 6, color: '#A3A3A6', textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>No auditions logged yet</div>
          <div style={{ fontSize: 11.5 }}>Log your first audition to see the funnel.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stages.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 84, fontSize: 12, color: '#3A4A66' }}>{s.label}</div>
              <div style={{
                flex: 1, height: 20, background: '#F1F3F7',
                borderRadius: 4, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${s.pct}%`,
                  background: s.color, borderRadius: 4,
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  transition: 'width 400ms ease', minWidth: s.value > 0 ? 28 : 0,
                }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600,
                    color: i >= 1 ? '#fff' : '#3A4A66',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    {s.value}
                  </span>
                </div>
              </div>
              <div style={{
                width: 40, textAlign: 'right', fontSize: 11, color: '#888',
                fontFamily: 'DM Mono, monospace',
              }}>
                {s.pct}%
              </div>
            </div>
          ))}
        </div>
      )}
    </DashCard>
  );
};

export default FunnelCard;
