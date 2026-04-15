import React, { useState } from 'react';
import { activities, campaigns } from '../../config/mockData';
import { Film, BarChart2, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// Active productions derived from financing closed deals
const activeProductions = [
  {
    title: 'Saltwater',
    director: 'Nina Choi',
    budget: '$900K',
    country: 'Massachusetts, US',
    phase: 'In Production',
    phaseColor: 'amber',
    budgetSpent: 62,
    qualifiedSpend: 74,
    milestone: 'Week 3 of principal photography',
    cashFlow: 'On track',
    qualifiedAmount: '$418K of $560K',
    daysLeft: 18,
  },
  {
    title: 'Echo Valley',
    director: 'Tom Brennan',
    budget: '$2.8M',
    country: 'New Mexico, US',
    phase: 'Pre-Production',
    phaseColor: 'blue',
    budgetSpent: 12,
    qualifiedSpend: 18,
    milestone: 'Location scouts complete, crew locked',
    cashFlow: 'On track',
    qualifiedAmount: '$84K of $1.68M',
    daysLeft: 45,
  },
];

// Distributed / completed films
const distributed = [
  {
    title: 'Last County',
    director: 'Barret Mulholland',
    budget: '$1.2M',
    platforms: ['Hulu', 'Prime', 'YouTube'],
    streams: '142,847',
    streamGrowth: '+12.4%',
    festivalNote: 'Blood in the Snow Film Festival — premiered 2024',
    pressNote: '"A triumph of genre-blending brilliance" — Film Threat',
    taxStatus: 'Tax rebate filed · Saved $180K',
  },
];

const phaseColorMap = {
  amber:   { badge: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500' },
  blue:    { badge: 'bg-blue-500/10 text-blue-400',   bar: 'bg-blue-500' },
  emerald: { badge: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500' },
};

const kpis = [
  { label: 'Active Productions', value: '2',        sub: 'Currently tracking' },
  { label: 'Total Budget Tracked', value: '$3.7M',  sub: 'Saltwater + Echo Valley' },
  { label: 'Qualified Spend to Date', value: '$502K', sub: 'Incentive-eligible' },
  { label: 'Films Distributed',  value: '1',        sub: 'Last County — 142K streams' },
];

const productionActivities = activities.filter(a => ['film', 'financing'].includes(a.vertical));
const productionCampaigns  = campaigns.filter(c => c.vertical === 'film');

const ProgressBar = ({ pct, color = 'bg-emerald-500' }) => (
  <div className="w-full bg-zinc-800 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
  </div>
);

export const ProductionsView = () => {
  const [activeTab, setActiveTab] = useState('Production Tracking');
  const tabs = ['Production Tracking', 'Distribution', 'Activity'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Productions & Distribution</h1>
          <p className="text-sm text-zinc-500 mt-1">
            AI-assisted production tracking — budget vs. actuals, qualified spend, milestones — and data-driven distribution planning.
          </p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium">
          Vertical B
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
            <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">{k.value}</div>
            <div className="text-sm font-medium text-zinc-300 mb-0.5">{k.label}</div>
            <div className="text-xs text-zinc-500">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Production Tracking */}
      {activeTab === 'Production Tracking' && (
        <div className="space-y-4">
          {activeProductions.map(p => {
            const colors = phaseColorMap[p.phaseColor];
            return (
              <div key={p.title} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-base font-bold text-zinc-100">{p.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Dir. {p.director} · {p.country} · {p.budget}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>{p.phase}</span>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock size={11} />
                      {p.daysLeft}d remaining
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-zinc-500">Budget Spent</span>
                      <span className="text-xs font-mono font-semibold text-zinc-300">{p.budgetSpent}%</span>
                    </div>
                    <ProgressBar pct={p.budgetSpent} color={colors.bar} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-zinc-500">Qualified Spend</span>
                      <span className="text-xs font-mono font-semibold text-emerald-400">{p.qualifiedSpend}%</span>
                    </div>
                    <ProgressBar pct={p.qualifiedSpend} color="bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Qualified Amount</div>
                    <div className="text-xs font-mono font-semibold text-emerald-400">{p.qualifiedAmount}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span className="text-xs text-zinc-400 font-medium">Current Milestone</span>
                    </div>
                    <div className="text-xs text-zinc-300">{p.milestone}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart2 size={12} className="text-blue-400" />
                      <span className="text-xs text-zinc-400 font-medium">Cash Flow</span>
                    </div>
                    <div className="text-xs text-zinc-300">{p.cashFlow}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeProductions.length === 0 && (
            <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-8 text-center text-sm text-zinc-500">
              No active productions.
            </div>
          )}
        </div>
      )}

      {/* Distribution */}
      {activeTab === 'Distribution' && (
        <div className="space-y-4">
          {distributed.map(f => (
            <div key={f.title} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Film size={22} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-zinc-100">{f.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Dir. {f.director} · {f.budget}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {f.platforms.map(p => (
                      <span key={p} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold font-mono text-zinc-100">{f.streams}</div>
                  <div className="text-xs text-emerald-400 font-medium">{f.streamGrowth} MoM</div>
                  <div className="text-xs text-zinc-500 mt-0.5">total streams</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="text-xs text-zinc-500 mb-1">Festival</div>
                  <div className="text-xs text-zinc-300">{f.festivalNote}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="text-xs text-zinc-500 mb-1">Press</div>
                  <div className="text-xs text-zinc-300 italic">{f.pressNote}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="text-xs text-zinc-500 mb-1">Incentive Status</div>
                  <div className="text-xs text-emerald-400 font-medium">{f.taxStatus}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Distribution strategy notes */}
          <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
            <div className="text-sm font-semibold text-zinc-300 mb-3">Distribution Playbook</div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> AI-driven audience-segment analysis to match each film to the right markets, festivals, and platforms</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> Horror/thriller → Hulu, Shudder, festival circuit (Blood in the Snow, Fantasia, SXSW)</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> Influencer micro-targeting (horror/indie film communities) to drive streaming lift</li>
              <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> Cross-vertical leverage: film composers (Luke) and artists (Talise) create natural cross-promotional reach</li>
            </ul>
          </div>
        </div>
      )}

      {/* Activity */}
      {activeTab === 'Activity' && (
        <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <h3 className="text-sm font-semibold text-zinc-100">Recent Agent Activity</h3>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {productionActivities.map((a, i) => (
              <div key={i} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-snug">{a.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">{a.agent}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
