import React from 'react';
import { FanSegments } from './FanSegments';
import { NewsletterBuilder } from './NewsletterBuilder';

export const CommunityHub = () => {
  const metrics = [
    { label: 'Total Fans', value: '2,847', change: '+12%' },
    { label: 'Email Subscribers', value: '847', change: '+89' },
    { label: 'Newsletter Open Rate', value: '24.3%', change: 'Above avg' },
    { label: 'Cross-Segment Overlap', value: '34%', change: '' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="text-sm text-zinc-400 mb-1">{metric.label}</div>
            <div className="text-2xl font-bold font-mono text-zinc-100">{metric.value}</div>
            {metric.change && (
              <div className="text-xs text-emerald-500 mt-1">{metric.change}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <FanSegments />
        </div>
        <div className="col-span-2">
          <NewsletterBuilder />
        </div>
      </div>
    </div>
  );
};