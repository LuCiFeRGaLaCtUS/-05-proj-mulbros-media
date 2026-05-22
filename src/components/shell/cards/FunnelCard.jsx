import React from 'react';
import { DashCard } from './DashCard';

/**
 * FunnelCard — 4-stage acquisition funnel (Traffic → Trial → Activated → Paid).
 * Mock data Phase B; replace with real talent/agency hook data when wired.
 *
 * Adapted from FSZT screen7-dashboard.jsx lines 883-915.
 */
const DEFAULT_FUNNEL = {
  title: 'Funnel overview (last 30 days)',
  stages: [
    { label: 'Traffic',      value: 58_400, pct: 100, color: '#D5DCE6' },
    { label: 'Trial starts', value:  1_680, pct:  28, color: '#8FB3A8' },
    { label: 'Activated',    value:    980, pct:  16, color: '#3E8C76' },
    { label: 'Paid',         value:    420, pct:   7, color: '#0F6E56' },
  ],
};

export const FunnelCard = ({ data, locked, onLearnMore }) => {
  const d = data || DEFAULT_FUNNEL;
  return (
    <DashCard
      title={d.title}
      locked={locked}
      lockedHint="Unlocks Day 2"
      onLearnMore={onLearnMore}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {d.stages.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 92, fontSize: 12, color: '#3A4A66' }}>{s.label}</div>
            <div style={{
              flex: 1, height: 20, background: '#F1F3F7',
              borderRadius: 4, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${s.pct}%`,
                background: s.color, borderRadius: 4,
                display: 'flex', alignItems: 'center', paddingLeft: 8,
                transition: 'width 400ms ease',
              }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: i >= 2 ? '#fff' : '#3A4A66',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  {s.value.toLocaleString()}
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
    </DashCard>
  );
};

export default FunnelCard;
