import React from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';

/**
 * DashCard — wrapper for FSZT v2 dashboard cards.
 * Title bar + optional "Learn more" link + body content.
 * Renders skeleton placeholder when `locked` is true.
 */
export const DashCard = ({ title, subtitle, onLearnMore, locked, lockedHint, children }) => (
  <div style={{
    background:   '#FFFFFF',
    border:       '1px solid #E0E0E0',
    borderRadius: 14,
    padding:      18,
    boxShadow:    '0 1px 3px rgba(11,29,58,0.04)',
    display:      'flex',
    flexDirection: 'column',
    minHeight:    180,
  }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 8, marginBottom: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#0B1D3A',
          letterSpacing: '-0.01em',
          fontFamily: "'Inter Tight', sans-serif",
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {onLearnMore && !locked && (
        <button onClick={onLearnMore} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: '#0F6E56', fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>
          Learn more <ArrowUpRight size={11} />
        </button>
      )}
    </div>

    <div style={{ flex: 1, minHeight: 0 }}>
      {locked ? (
        <div style={{
          height: '100%', minHeight: 120,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, color: '#A3A3A6',
          background: 'repeating-linear-gradient(45deg, #F8F8FA 0 8px, transparent 8px 16px)',
          borderRadius: 8,
        }}>
          <Loader2 size={16} className="animate-spin" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 11.5, fontWeight: 500 }}>
            {lockedHint || 'Unlocks soon'}
          </div>
        </div>
      ) : children}
    </div>
  </div>
);

export default DashCard;
