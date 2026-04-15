import React from 'react';
import { Activity } from 'lucide-react';

const verticalColorMap = {
  financing: 'bg-blue-500',
  film: 'bg-emerald-500',
  music: 'bg-amber-500',
  composer: 'bg-amber-500',
  community: 'bg-purple-500',
  strategy: 'bg-rose-500'
};

const verticalLabelMap = {
  financing: 'Film Financing',
  film: 'Film',
  music: 'Music',
  composer: 'Composer',
  community: 'Community',
  strategy: 'Strategy'
};

const verticalBadgeMap = {
  financing: 'bg-blue-500/10 text-blue-400',
  film: 'bg-emerald-500/10 text-emerald-400',
  music: 'bg-amber-500/10 text-amber-400',
  composer: 'bg-amber-500/10 text-amber-400',
  community: 'bg-purple-500/10 text-purple-400',
  strategy: 'bg-rose-500/10 text-rose-400'
};

export const ActivityFeed = ({ activities }) => {
  return (
    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 shadow-xl shadow-black/30 h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-100">Activity Feed</h3>
        </div>
        <span className="text-xs text-zinc-500">{activities.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex gap-3 px-5 py-3 border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors last:border-b-0"
          >
            <div className="flex-shrink-0 pt-1.5">
              <span className={`block w-1.5 h-1.5 rounded-full ${verticalColorMap[activity.vertical]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 leading-snug line-clamp-2">{activity.action}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${verticalBadgeMap[activity.vertical]}`}>
                  {verticalLabelMap[activity.vertical]}
                </span>
                <span className="text-xs text-zinc-600">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
