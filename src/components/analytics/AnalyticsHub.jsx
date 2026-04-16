import React, { useState } from 'react';
import { MetricCard } from './MetricCard';
import { PerformanceChart } from './PerformanceChart';

export const AnalyticsHub = () => {
  const [selectedAsset, setSelectedAsset] = useState('all');

  const tabs = ['All Assets', 'Last County', 'Talise', 'Luke'];

  const allAssetMetrics = [
    { title: 'Total Impressions',   value: '1.24M',  change: '+18%',       changeType: 'positive' },
    { title: 'Total Engagement',    value: '89.4K',  change: '+22%',       changeType: 'positive' },
    { title: 'Email Subscribers',   value: '847',    change: '+12%',       changeType: 'positive' },
    { title: 'Active Campaigns',    value: '4',      change: '',           changeType: '' },
    { title: 'Agent Actions (24h)', value: '47',     change: '',           changeType: '' },
    { title: 'Revenue Pipeline',    value: '$214K',  change: '',           changeType: '' }
  ];

  const lastCountyMetrics = [
    { title: 'Hulu Streams',          value: '142,847', change: '',       changeType: '' },
    { title: 'Landing Page Views',    value: '28,400',  change: '',       changeType: '' },
    { title: 'Landing Page CTR',      value: '4.2%',    change: '',       changeType: '' },
    { title: 'Social Impressions',    value: '284K',    change: '',       changeType: '' },
    { title: 'Influencer Responses',  value: '8/12',    change: '67%',    changeType: '' },
    { title: 'Est. Revenue',          value: '$0',      change: 'TBD',    changeType: '' }
  ];

  const taliseMetrics = [
    { title: 'Spotify Monthly Listeners', value: '85,230',  change: '',           changeType: '' },
    { title: 'Spotify Streams (30d)',      value: '142K',    change: '',           changeType: '' },
    { title: 'YouTube Views (30d)',        value: '34.5K',   change: '',           changeType: '' },
    { title: 'Instagram ER',              value: '4.8%',    change: '',           changeType: '' },
    { title: 'TikTok Views (30d)',         value: '89K',     change: '',           changeType: '' },
    { title: 'Playlist Adds',             value: '12',      change: 'this month', changeType: '' }
  ];

  const lukeMetrics = [
    { title: 'Portfolio Page Views', value: '1,240',  change: '',           changeType: '' },
    { title: 'Inbound Inquiries',    value: '6',      change: 'this month', changeType: '' },
    { title: 'Outbound Emails',      value: '47',     change: '',           changeType: '' },
    { title: 'Response Rate',        value: '14.9%',  change: '',           changeType: '' },
    { title: 'Active Deals',         value: '3',      change: '',           changeType: '' },
    { title: 'Pipeline Value',       value: '$65K',   change: '',           changeType: '' }
  ];

  const getMetrics = () => {
    switch (selectedAsset) {
      case 'last-county': return lastCountyMetrics;
      case 'talise':      return taliseMetrics;
      case 'luke':        return lukeMetrics;
      default:            return allAssetMetrics;
    }
  };

  const chartData = [
    { name: 'Last County', value: 4500 },
    { name: 'Talise',      value: 3200 },
    { name: 'Luke',        value: 800  }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedAsset(tab.toLowerCase().replace(' ', '-'))}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                selectedAsset === tab.toLowerCase().replace(' ', '-')
                  ? 'text-amber-400 border-amber-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4">
        {getMetrics().map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Performance chart */}
      <div className="relative bg-zinc-900 rounded-xl p-6 border border-amber-900/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
        {/* Film strip holes */}
        <div className="absolute top-1.5 left-0 right-0 flex gap-1.5 px-4 pointer-events-none opacity-10">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} className="flex-1 h-1.5 bg-white rounded-[1px]" />)}
        </div>
        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Performance</h3>
          <PerformanceChart data={chartData} type="bar" />
        </div>
      </div>
    </div>
  );
};
