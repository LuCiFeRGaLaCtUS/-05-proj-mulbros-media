import React from 'react';

export const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const AmberBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 blur-xl rounded-full pointer-events-none" />
  </>
);

export const StatLabel = ({ children, Icon }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)' }}
    className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5"
  >
    {Icon && <Icon size={10} />}
    {children}
  </div>
);

export const StatNumber = ({ children }) => (
  <div
    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
    className="text-[1.65rem] font-bold text-zinc-900 leading-none tabular-nums"
  >
    {children}
  </div>
);

export const KpiCard = ({ label, value, Icon }) => (
  <div className="tile-pop relative bg-white rounded-2xl p-5 overflow-hidden" style={CARD_STYLE}>
    <AmberBg />
    <div className="relative z-10">
      <StatLabel Icon={Icon}>{label}</StatLabel>
      <StatNumber>{value}</StatNumber>
    </div>
  </div>
);

export const fmtUsd = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000)    return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const PageHeader = ({ Icon, title, subtitle }) => (
  <div className="relative overflow-hidden tile-pop bg-white rounded-2xl p-5" style={CARD_STYLE}>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 w-48 h-24 bg-amber-100 blur-xl rounded-full pointer-events-none" />
    <div className="relative z-10">
      <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
        {Icon && <Icon size={22} className="text-amber-600" />}
        {title}
      </h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{subtitle}</p>}
    </div>
  </div>
);

export const StatusBadge = ({ status, palette }) => {
  const cls = palette[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{status}</span>;
};
