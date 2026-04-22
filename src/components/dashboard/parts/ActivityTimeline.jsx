import React from 'react';
import { Award, Mic, Film, Radio, Zap, Star, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { BgTimeline } from './backgrounds';
import { C } from './constants';

const events = [
  { id: 'last-county',   Icon: Award,  color: C.gold,    label: 'Last County hit 142,847 streams on Hulu',     time: 'Today, 9:14 AM',     page: 'productions' },
  { id: 'saltwater',     Icon: Mic,    color: C.emerald, label: 'Luke — Saltwater delivery confirmed ($12K)',   time: 'Yesterday, 3:20 PM', page: 'financing'   },
  { id: 'echo-valley',   Icon: Film,   color: C.blue,    label: 'Echo Valley pitched at $35K — negotiating',   time: 'Apr 14, 11:00 AM',   page: 'financing'   },
  { id: 'talise-tiktok', Icon: Radio,  color: C.purple,  label: 'Talise TikTok crossed 45,800 followers',      time: 'Apr 13, 2:45 PM',    page: 'music'       },
  { id: 'stage32-lead',  Icon: Zap,    color: C.gold,    label: 'New lead: indie director sourced via Stage32', time: 'Apr 12, 6:00 PM',    page: 'financing'   },
  { id: 'community',     Icon: Star,   color: C.emerald, label: 'Community milestone — 2,847 fans reached',    time: 'Apr 11, 10:30 AM',   page: 'music'       },
];

export const ActivityTimeline = ({ onItemClick }) => (
  <div className="tile-pop relative rounded-2xl overflow-hidden"
    style={{ background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 50%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <BgTimeline />
    <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100">
      <div>
        <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Studio Activity</h3>
        <p className="text-xs mt-0.5 flex items-center gap-1.5">
          <TrendingUp size={11} className="text-emerald-500" />
          <span className="text-emerald-600 font-bold">+28%</span>
          <span className="text-zinc-500">activity this month</span>
        </p>
      </div>
    </div>
    <div className="relative z-10 px-4 py-2">
      {events.map(({ id, Icon, color, label, time, page }, i) => (
        <button key={id} onClick={() => onItemClick?.(page)}
          className="w-full flex gap-4 py-2.5 px-1 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer group text-left">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}>
              <Icon size={13} style={{ color }} />
            </div>
            {i < events.length - 1 && <div className="w-px bg-zinc-200 mt-1" style={{ height: 14 }} />}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs text-zinc-700 leading-snug group-hover:text-zinc-900 transition-colors">{label}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={9} className="text-zinc-600 flex-shrink-0" />
              <span className="text-xs text-zinc-600">{time}</span>
            </div>
          </div>
          <ArrowRight size={11} className="text-zinc-500 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all mt-2 flex-shrink-0" />
        </button>
      ))}
    </div>
  </div>
);
