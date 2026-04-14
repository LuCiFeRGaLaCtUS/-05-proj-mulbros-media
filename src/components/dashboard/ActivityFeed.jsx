import React from 'react';

const verticalColorMap = {
  film: 'bg-blue-500',
  music: 'bg-amber-500',
  composer: 'bg-emerald-500',
  community: 'bg-purple-500',
  strategy: 'bg-rose-500'
};

export const ActivityFeed = ({ activities }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-lg shadow-black/20 h-full">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">Activity Feed</h3>
      <div className="max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all"
          >
            <div className="flex-shrink-0 mt-1">
              <div className={`w-2 h-2 rounded-full ${verticalColorMap[activity.vertical]}`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 truncate">{activity.action}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">{activity.agent}</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};