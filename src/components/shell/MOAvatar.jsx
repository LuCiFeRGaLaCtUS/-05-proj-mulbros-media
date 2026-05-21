import React from 'react';
import { usePersona } from '../../lib/personaState';

/**
 * MO Avatar — node-network SVG mark with pulse states.
 * Adapted from FSZT (Remix)/src/avatar.jsx.
 *
 * Props:
 *   size   — px, defaults 80
 *   state  — 'idle' | 'thinking' | 'speaking' (overrides personaState)
 *   image  — optional image URL (overrides personaState.image)
 */
export const MOAvatar = ({ size = 80, state, image }) => {
  const { persona } = usePersona();
  const effectiveState = state || persona.state || 'idle';
  const effectiveImage = image !== undefined ? image : persona.image;
  const active = effectiveState !== 'idle';

  // Image variant — photo + teal ring + pulse
  if (effectiveImage) {
    return (
      <div style={{
        width: size, height: size, position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && (
          <div style={{
            position: 'absolute', inset: -2, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(93,202,165,0.35), transparent 70%)',
            animation: 'pulse-teal 2.4s ease-out infinite',
          }} />
        )}
        <img src={effectiveImage} alt="" style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: `${Math.max(1, size / 40)}px solid rgba(93,202,165,0.55)`,
          background: '#0B1D3A',
          position: 'relative', zIndex: 1,
          boxShadow: `0 0 ${size * 0.35}px rgba(15,110,86,0.28)`,
        }} />
      </div>
    );
  }

  // SVG node-network mark
  const cx = size / 2;
  const cy = size / 2;
  const stroke   = '#0F6E56';
  const strokeW  = Math.max(1, size / 60);
  const centerR  = size * 0.055;
  const outerR   = size * 0.035;
  const ringR    = size * 0.42;

  // 4 outer nodes (top-left, top-right, bottom-left, bottom-right)
  const angles = [-135, -45, 45, 135];
  const pts = angles.map(a => {
    const rad = (a * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * size * 0.28, y: cy + Math.sin(rad) * size * 0.28 };
  });

  // Speed multiplier per state
  const animDur = effectiveState === 'speaking' ? '1.2s'
                : effectiveState === 'thinking' ? '1.8s'
                : '2.4s';

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {active && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,110,86,0.18), transparent 70%)',
          animation: `pulse-teal ${animDur} ease-out infinite`,
        }} />
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'relative', zIndex: 1 }}>
        {/* faint outer ring */}
        <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={stroke} strokeOpacity="0.12" strokeWidth={strokeW} />

        {/* connecting lines */}
        {pts.map((p, i) => (
          <line key={`l${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" strokeOpacity="0.6" />
        ))}

        {/* outer dots — staggered pulse when active */}
        {pts.map((p, i) => (
          <circle key={`d${i}`} cx={p.x} cy={p.y} r={outerR} fill={stroke}
            style={{
              animation: active ? `dot-pulse ${animDur} ease-in-out infinite ${i * 0.25}s` : 'none',
              transformOrigin: `${p.x}px ${p.y}px`,
            }} />
        ))}

        {/* center node */}
        <circle cx={cx} cy={cy} r={centerR} fill="#0B1D3A" />
        <circle cx={cx} cy={cy} r={centerR * 0.45} fill={stroke} />
      </svg>
    </div>
  );
};

/**
 * Compact inline chip — avatar + name. Used inside chat messages.
 */
export const MOChip = ({ label, image, size = 22 }) => {
  const { persona } = usePersona();
  const name = label || persona.name || 'MO';
  const img  = image !== undefined ? image : persona.image;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px 4px 4px', borderRadius: 999,
      background: 'rgba(15,110,86,0.08)', color: '#0F6E56',
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ display: 'inline-flex', padding: img ? 0 : 2, background: '#fff', borderRadius: '50%' }}>
        <MOAvatar size={img ? size : size - 4} state="idle" image={img} />
      </span>
      {name}
    </span>
  );
};

export default MOAvatar;
