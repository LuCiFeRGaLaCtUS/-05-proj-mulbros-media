import React from 'react';
import { FanSegments } from './FanSegments';
import { NewsletterBuilder } from './NewsletterBuilder';

export const CommunityHub = () => {
  const metrics = [
    { label: 'Total Fans',             value: '2,847', change: '+12%'      },
    { label: 'Email Subscribers',      value: '847',   change: '+89'       },
    { label: 'Newsletter Open Rate',   value: '24.3%', change: 'Above avg' },
    { label: 'Cross-Segment Overlap',  value: '34%',   change: ''          }
  ];

  return (
    <div className="space-y-5">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="relative bg-zinc-900 rounded-xl p-5 border border-purple-900/25 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-zinc-900 to-zinc-950 pointer-events-none" />
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-500/10 blur-xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="text-xs text-zinc-500 mb-1">{metric.label}</div>
              <div className="text-2xl font-bold font-mono text-zinc-100">{metric.value}</div>
              {metric.change && (
                <div className="text-xs text-emerald-400 mt-1">{metric.change}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Fan Segments + Newsletter ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <FanSegments />
        </div>
        <div className="lg:col-span-2">
          <NewsletterBuilder />
        </div>
      </div>
    </div>
  );
};
