import React from 'react';
import { DashCard } from './DashCard';

/**
 * ChurnCard — at-risk count + pattern callout.
 * Adapted from FSZT screen7-dashboard.jsx lines 859-881.
 */
const DEFAULT_CHURN = {
  title:       'Churn signals detected',
  count:       '34',
  unit:        'subscribers inactive 14+ days',
  patternHtml: '68% of churned subscribers completed exactly <strong>1 certification</strong>.',
};

export const ChurnCard = ({ data, locked, onLearnMore }) => {
  const d = data || DEFAULT_CHURN;
  return (
    <DashCard
      title={d.title}
      locked={locked}
      lockedHint="Unlocks Day 3"
      onLearnMore={onLearnMore}
    >
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14,
      }}>
        <span style={{
          fontSize: 32, fontWeight: 600,
          color: '#E24B4A',
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontFamily: 'DM Mono, monospace',
        }}>
          {d.count}
        </span>
        <span style={{ fontSize: 12.5, color: '#888' }}>{d.unit}</span>
      </div>
      <div style={{
        background: 'rgba(226,75,74,0.10)',
        border:     '1px solid #F2D4C5',
        borderRadius: 8,
        padding:    '10px 12px',
        fontSize:   12.5,
        color:      '#7A2F14',
        lineHeight: 1.5,
      }}>
        <span style={{
          fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.1em', marginRight: 6, fontWeight: 600,
          fontFamily: 'DM Mono, monospace',
        }}>
          Pattern
        </span>
        <span dangerouslySetInnerHTML={{ __html: d.patternHtml }} />
      </div>
    </DashCard>
  );
};

export default ChurnCard;
