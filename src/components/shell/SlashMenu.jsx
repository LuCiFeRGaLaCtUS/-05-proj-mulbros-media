import React, { useEffect, useState, useRef } from 'react';
import { getSlashCatalog } from '../../lib/personaRouter';

/**
 * SlashMenu — popover shown when user types `/` in ChatBar.
 * Filters the slash command catalog by the typed prefix.
 *
 * Props:
 *   query    — string after the slash, e.g. "aud" for /aud
 *   onPick   — (cmd: string) => void   called with full "/audition" form
 *   onClose  — () => void              dismiss handler
 *   anchorEl — ref to position relative to (input element)
 */
export const SlashMenu = ({ query, onPick, onClose }) => {
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const catalog = getSlashCatalog();
  const q = (query || '').toLowerCase();
  const filtered = q
    ? catalog.filter(c =>
        c.command.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q),
      )
    : catalog;

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const onKey = (e) => {
      if (filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(i => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const pick = filtered[active];
        if (pick) onPick(pick.command);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [filtered, active, onPick, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full mb-2 left-0 w-80 rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background:    '#FFFFFF',
        border:        '1px solid #E0E0E0',
        boxShadow:     '0 12px 28px rgba(11,29,58,0.14)',
        zIndex:        50,
        maxHeight:     320,
        overflowY:     'auto',
      }}
    >
      <div style={{
        padding: '8px 12px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#0F6E56',
        background: 'rgba(15,110,86,0.04)',
        fontFamily: 'DM Mono, monospace',
      }}>
        Slash commands · {filtered.length}
      </div>
      {filtered.map((c, i) => (
        <button
          key={c.command}
          onClick={() => onPick(c.command)}
          onMouseEnter={() => setActive(i)}
          className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors"
          style={{
            background:    i === active ? 'rgba(15,110,86,0.06)' : 'transparent',
            borderBottom:  '1px solid #F0F0F0',
            color:         '#0B1D3A',
          }}
        >
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 12,
            color: '#0F6E56',
            fontWeight: 600,
            minWidth: 90,
          }}>
            {c.command}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
            {c.description && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.3 }}>
                {c.description.slice(0, 80)}{c.description.length > 80 ? '…' : ''}
              </div>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SlashMenu;
