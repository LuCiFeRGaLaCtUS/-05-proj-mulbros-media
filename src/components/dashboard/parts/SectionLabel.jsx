import React from 'react';

export const SectionLabel = ({ label, sub }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-[11px] font-extrabold tracking-[0.22em] text-zinc-600 uppercase flex-shrink-0"
      style={{ fontFamily: 'var(--font-sans)' }}>
      {label}
    </span>
    {sub && <span className="text-[11px] text-zinc-600 flex-shrink-0">· {sub}</span>}
    <div className="flex-1 h-px bg-zinc-200" />
  </div>
);
