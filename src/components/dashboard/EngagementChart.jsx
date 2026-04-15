import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SERIES = [
  { key: 'filmFinancing', label: 'Film Financing', color: '#3b82f6' },
  { key: 'talentOS',      label: 'Music & Comp.',  color: '#f59e0b' },
  { key: 'lastCounty',    label: 'Last County',    color: '#10b981' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800/95 border border-zinc-700 rounded-xl p-3 shadow-2xl shadow-black/50 backdrop-blur-sm">
      <p className="text-zinc-300 text-xs font-semibold mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="text-zinc-100 font-mono font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ active, onToggle }) => (
  <div className="flex items-center gap-4">
    {SERIES.map(s => {
      const isActive = active.includes(s.key);
      return (
        <button
          key={s.key}
          onClick={() => onToggle(s.key)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
        >
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="text-zinc-400">{s.label}</span>
        </button>
      );
    })}
  </div>
);

export const EngagementChart = ({ data }) => {
  const [activeSeries, setActiveSeries] = useState(SERIES.map(s => s.key));

  const toggleSeries = (key) => {
    setActiveSeries(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  return (
    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 shadow-xl shadow-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/60">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Engagement Overview</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Daily reach across all assets</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomLegend active={activeSeries} onToggle={toggleSeries} />
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
            30 Days
          </span>
        </div>
      </div>

      <div className="h-72 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#3f3f46"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              stroke="#3f3f46"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {SERIES.map(s => activeSeries.includes(s.key) && (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
