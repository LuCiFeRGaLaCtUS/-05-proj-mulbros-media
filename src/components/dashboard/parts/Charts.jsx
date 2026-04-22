import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ExternalLink } from 'lucide-react';
import { BgRevenueChart, BgPlatformChart } from './backgrounds';
import { C, REVENUE_DATA, PLATFORM_DATA, PLATFORM_COLORS } from './constants';

const CustomBar = ({ x, y, width, height, index }) => {
  const color = PLATFORM_COLORS[index % PLATFORM_COLORS.length];
  const id = `pb-${index}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={5} fill={`url(#${id})`} />
    </g>
  );
};

export const RevenueChart = () => {
  const LINES = [
    { key: 'financing',   label: 'Film Financing', color: C.blue    },
    { key: 'music',       label: 'Music & Comp.',  color: C.gold    },
    { key: 'productions', label: 'Productions',    color: C.emerald },
  ];
  const [active, setActive] = useState(LINES.map(l => l.key));
  const toggle = (key) => setActive(p => p.includes(key) ? (p.length > 1 ? p.filter(k => k !== key) : p) : [...p, key]);

  return (
    <div className="tile-pop relative rounded-2xl overflow-hidden group"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8faff 40%, #ffffff 70%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <BgRevenueChart />
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Revenue Pipeline</h3>
          <p className="text-xs text-zinc-500 mt-0.5">6-month forecast · click legend to toggle</p>
        </div>
        <div className="flex items-center gap-4">
          {LINES.map(l => (
            <button key={l.key} onClick={() => toggle(l.key)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${active.includes(l.key) ? 'opacity-100' : 'opacity-30'}`}>
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-zinc-600">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative z-10 h-56 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {LINES.map(l => (
                <linearGradient key={l.key} id={`rev-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={l.color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `$${v / 1000}K`} width={44} />
            <Tooltip
              content={({ active: a, payload, label }) => a && payload?.length
                ? <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs">
                    <p className="text-zinc-600 font-semibold mb-2">{label}</p>
                    {payload.map((e, i) => (
                      <div key={`${e.name}-${i}`} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-zinc-500">{e.name}:</span>
                        <span className="text-zinc-900 font-mono font-semibold">${e.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div> : null}
              cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {LINES.map(l => active.includes(l.key) && (
              <Area key={l.key} type="monotone" dataKey={l.key} name={l.label}
                stroke={l.color} strokeWidth={2.5} fillOpacity={1} fill={`url(#rev-${l.key})`}
                dot={false} activeDot={{ r: 5, fill: l.color, strokeWidth: 0 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PlatformChart = ({ onClick }) => (
  <button onClick={onClick}
    className="tile-pop relative w-full text-left rounded-2xl overflow-hidden cursor-pointer group"
    style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fffdf5 40%, #ffffff 70%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <BgPlatformChart />
    <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
      <div>
        <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Talise — Platform Reach</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Monthly audience by platform</p>
      </div>
      <ExternalLink size={12} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
    </div>
    <div className="relative z-10 h-56 px-2 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={PLATFORM_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="#d4d4d8" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={36} />
          <Tooltip
            content={({ active: a, payload, label }) => a && payload?.length
              ? <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs">
                  <p className="text-zinc-600 font-semibold mb-1">{label}</p>
                  <p className="text-zinc-900 font-mono font-bold">{payload[0].value.toLocaleString()}</p>
                </div> : null}
            cursor={{ fill: 'rgba(0,0,0,0.025)' }}
          />
          <Bar dataKey="value" shape={<CustomBar />} maxBarSize={44}>
            {PLATFORM_DATA.map((d, i) => <Cell key={d.name} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </button>
);
