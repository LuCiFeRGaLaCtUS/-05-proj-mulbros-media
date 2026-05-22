import React, { useState } from 'react';
import { useAppContext } from '../../../App';
import { usePersona } from '../../../lib/personaState';
import { getDashboardDay, advanceDashboardDay, MAX_DAY } from '../../../lib/dashboardDay';
import { MOAvatar } from '../MOAvatar';

/**
 * ObservationBar — navy banner at top of ChatHome.
 * Shows: MO avatar + "{name} is observing" + Day N/7 + progress bar + Advance button.
 * Click "Advance" increments profiles.dashboard_day (loops 7 -> 1).
 *
 * Adapted from FSZT screen7-dashboard.jsx lines 685-718.
 */
export const ObservationBar = () => {
  const { profile, updateProfile } = useAppContext();
  const { persona } = usePersona();

  const initialDay = getDashboardDay(profile);
  const [day, setDay] = useState(initialDay);
  const [busy, setBusy] = useState(false);

  const advance = async () => {
    if (busy || !profile?.id) return;
    setBusy(true);
    const next = await advanceDashboardDay(profile.id, day);
    if (next != null) {
      setDay(next);
      // Mirror into App context so consumers see fresh day immediately
      if (updateProfile) updateProfile({ dashboard_day: next });
    }
    setBusy(false);
  };

  const pct = (day / MAX_DAY) * 100;

  return (
    <div style={{
      background:  '#0B1D3A',
      borderRadius: 14,
      padding:     '18px 22px',
      color:       '#fff',
      marginBottom: 20,
      position:    'relative',
      overflow:    'hidden',
    }}>
      {/* ambient teal orb */}
      <div style={{
        position: 'absolute', right: -80, top: -60, width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15,110,86,0.35), transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <MOAvatar size={42} state="thinking" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 8, whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {persona.name || 'MO'} is observing
            </span>
            <span style={{
              width: 4, height: 4, borderRadius: '50%', background: '#4FB59A',
            }} />
            <span style={{
              fontSize: 11.5, color: '#A9C6BE',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontFamily: 'DM Mono, monospace',
            }}>
              Day {day} of {MAX_DAY}
            </span>
          </div>

          <div style={{
            height: 4, background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, #0F6E56 0%, #4FB59A 100%)',
              borderRadius: 2, transition: 'width 300ms ease',
            }} />
          </div>
        </div>

        <button
          onClick={advance}
          disabled={busy}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border:     '1px solid rgba(255,255,255,0.15)',
            color:      '#fff',
            borderRadius: 8,
            padding:    '8px 12px',
            fontSize:   12,
            cursor:     busy ? 'not-allowed' : 'pointer',
            opacity:    busy ? 0.6 : 1,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={e => { if (!busy) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          Advance day
        </button>
      </div>
    </div>
  );
};

export default ObservationBar;
