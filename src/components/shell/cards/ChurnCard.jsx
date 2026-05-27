import React from 'react';
import { DashCard } from './DashCard';

/**
 * ChurnCard — real "at-risk" signal. No mock data.
 * At-risk = auditions that went no-response + overdue commissions.
 * Healthy empty state when nothing is at risk.
 *
 * Props:
 *   noResponse   — count of no-response auditions
 *   overdue      — count of overdue commissions
 *   locked
 *   onLearnMore
 */
export const ChurnCard = ({ noResponse = 0, overdue = 0, locked, onLearnMore }) => {
  const atRisk = noResponse + overdue;

  return (
    <DashCard
      title="Attention needed"
      locked={locked}
      lockedHint="Unlocks Day 3"
      onLearnMore={atRisk > 0 ? onLearnMore : undefined}
    >
      {atRisk === 0 ? (
        <div style={{
          height: '100%', minHeight: 110,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 6, color: '#A3A3A6', textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>All clear</div>
          <div style={{ fontSize: 11.5 }}>No stale auditions or overdue commissions.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <span style={{
              fontSize: 32, fontWeight: 600, color: '#E24B4A',
              letterSpacing: '-0.025em', lineHeight: 1,
              fontFamily: 'DM Mono, monospace',
            }}>
              {atRisk}
            </span>
            <span style={{ fontSize: 12.5, color: '#888' }}>items need attention</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {noResponse > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 12.5, color: '#3A4A66',
                background: 'rgba(226,75,74,0.06)', borderRadius: 8, padding: '8px 12px',
              }}>
                <span>Auditions gone quiet (no response)</span>
                <span style={{ fontWeight: 700, color: '#E24B4A', fontFamily: 'DM Mono, monospace' }}>{noResponse}</span>
              </div>
            )}
            {overdue > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 12.5, color: '#3A4A66',
                background: 'rgba(226,75,74,0.06)', borderRadius: 8, padding: '8px 12px',
              }}>
                <span>Commissions overdue (30+ days)</span>
                <span style={{ fontWeight: 700, color: '#E24B4A', fontFamily: 'DM Mono, monospace' }}>{overdue}</span>
              </div>
            )}
          </div>
        </>
      )}
    </DashCard>
  );
};

export default ChurnCard;
