import React from 'react';

const verticalColors = {
  film: 'blue-500',
  music: 'amber-500',
  composer: 'emerald-500',
  community: 'purple-500'
};

export const CampaignCard = ({ campaign }) => {
  const statusColors = {
    Active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    Scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    Paused: { bg: 'bg-orange-500/10', text: 'text-orange-500' }
  };

  const statusStyle = statusColors[campaign.status] || statusColors.Active;

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-amber-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-zinc-100">{campaign.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
          {campaign.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {campaign.channels.map((channel, index) => (
          <span key={index} className="px-2 py-0.5 bg-zinc-700 rounded-full text-xs text-zinc-300">
            {channel}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {campaign.metrics.impressions !== undefined && (
          <>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Impressions</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                {campaign.metrics.impressions.toLocaleString()}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Clicks</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                {campaign.metrics.clicks.toLocaleString()}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Conversions</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                {campaign.metrics.conversions.toLocaleString()}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Spend</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                ${campaign.metrics.spend.toLocaleString()}
              </div>
            </div>
          </>
        )}
        {campaign.metrics.subscribers && (
          <>
            <div className="bg-zinc-800/50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-zinc-500">Subscribers</div>
              <div className="text-lg font-mono font-bold text-zinc-200">
                {campaign.metrics.subscribers.toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Progress</span>
          <span className="text-zinc-400">{campaign.progress}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div
            className="bg-amber-500 rounded-full h-2 transition-all"
            style={{ width: `${campaign.progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-zinc-500 mt-2">{campaign.agent}</div>
      </div>
    </div>
  );
};