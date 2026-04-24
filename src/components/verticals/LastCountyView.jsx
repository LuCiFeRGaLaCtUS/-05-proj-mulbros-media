import React, { useState } from 'react';
import { activities, campaigns } from '../../config/mockData';
import { Film, Play, Users, TrendingUp, Clock } from 'lucide-react';

// ── Cinematic background — emerald theme ─────────────────────────────────────
const EmeraldBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/25 via-zinc-900 to-zinc-950 pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full pointer-events-none" />
  </>
);

const streamingStats = [
  { platform: 'Hulu',    value: '89,200',  change: '+14%',  color: 'emerald' },
  { platform: 'Prime',   value: '31,400',  change: '+8.3%', color: 'blue'    },
  { platform: 'YouTube', value: '22,247',  change: '+18%',  color: 'red'     },
];

const kpis = [
  { label: 'Total Streams',      value: '142,847', sub: 'Hulu · Prime · YouTube'  },
  { label: 'MoM Growth',         value: '+12.4%',  sub: 'vs. last month'           },
  { label: 'Influencers Active', value: '12',      sub: 'Avg 45K followers each'  },
  { label: 'Campaign Reach',     value: '284K',    sub: 'Horror Season Push'       },
];

const colorMap = {
  emerald: 'text-emerald-400 bg-emerald-500/10',
  blue:    'text-blue-400 bg-blue-500/10',
  red:     'text-red-400 bg-red-500/10',
};

const filmActivities = activities.filter(a => a.vertical === 'film');
const filmCampaigns  = campaigns.filter(c => c.vertical === 'film');

export const LastCountyView = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Campaigns', 'Activity'];

  return (
    <div className="space-y-5">

      {/* ── Cinematic page header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-emerald-500/5 blur-xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(16,185,129,0.04),transparent_70%)] pointer-events-none" />
        {/* Film strip holes across top */}
        <div className="absolute top-1.5 left-0 right-0 flex gap-1.5 px-4 pointer-events-none opacity-10">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} className="flex-1 h-1.5 bg-white rounded-[1px]" />)}
        </div>
        {/* Lens rings */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/10 pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-emerald-500/15 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Last County</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Genre-blending thriller · Hulu, Prime, YouTube · Directed by Barret Mulholland
            </p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium">
            Film Distribution Vertical
          </span>
        </div>
      </div>

      {/* ── Film info card ────────────────────────────────────────────────── */}
      <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5 overflow-hidden">
        <EmeraldBg />
        <div className="relative z-10 flex items-start gap-5">
          <div className="w-16 h-20 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Film size={28} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-zinc-100 mb-1">Last County</div>
            <div className="text-sm text-zinc-600 mb-3">
              Premiered at Blood in the Snow Film Festival · Praised by Film Threat as "a triumph of genre-blending brilliance" ·
              Scored by Luke Mulholland · Directed by Barret Mulholland
            </div>
            <div className="flex flex-wrap gap-2">
              {['Hulu', 'Prime Video', 'YouTube', 'Blood in the Snow', 'Film Threat'].map(tag => (
                <span key={tag} className="text-xs bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-700/50">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5 overflow-hidden">
            <EmeraldBg />
            <div className="relative z-10">
              <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">{k.value}</div>
              <div className="text-sm font-medium text-zinc-500 mb-0.5">{k.label}</div>
              <div className="text-xs text-zinc-500">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-zinc-600 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {streamingStats.map(s => (
              <div key={s.platform} className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5 overflow-hidden">
                <EmeraldBg />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-zinc-500">{s.platform}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[s.color]}`}>{s.change}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">streams</div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5 overflow-hidden">
            <EmeraldBg />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <div className="text-sm font-semibold text-emerald-400">Distribution Strategy</div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> TikTok horror-season campaign targeting r/horror and indie-film communities</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> 12 horror micro-influencers (avg 45K followers) with custom DM scripts</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> Instagram behind-the-scenes content driving Hulu CTA</li>
                <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> 34% audience overlap with Talise fans — cross-promotion lever</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Campaigns ─────────────────────────────────────────────────────── */}
      {activeTab === 'Campaigns' && (
        <div className="space-y-4">
          {filmCampaigns.length === 0 && (
            <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-6 text-sm text-zinc-500 overflow-hidden">
              <EmeraldBg />
              <span className="relative z-10">No active campaigns.</span>
            </div>
          )}
          {filmCampaigns.map(c => (
            <div key={c.id} className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 p-5 overflow-hidden">
              <EmeraldBg />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{c.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{c.startDate} → {c.endDate}</div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{c.status}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.channels.map(ch => (
                    <span key={ch} className="text-xs bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded border border-zinc-700/50">{ch}</span>
                  ))}
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(c.metrics).map(([key, val]) => (
                    <div key={key}>
                      <div className="text-xs text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-sm font-semibold text-zinc-200 font-mono">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Activity ──────────────────────────────────────────────────────── */}
      {activeTab === 'Activity' && (
        <div className="relative bg-zinc-900 rounded-2xl ring-1 ring-emerald-900/30 overflow-hidden">
          <EmeraldBg />
          <div className="relative z-10">
            <div className="px-5 py-4 border-b border-zinc-800/60 bg-gradient-to-r from-emerald-500/5 to-transparent">
              <h3 className="text-sm font-semibold text-zinc-100">Recent Agent Activity</h3>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {filmActivities.map((a, i) => (
                <div key={i} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-500 leading-snug">{a.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">{a.agent}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filmActivities.length === 0 && (
                <div className="px-5 py-6 text-sm text-zinc-500">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
