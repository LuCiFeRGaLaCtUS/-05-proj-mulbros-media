import React, { useState } from 'react';
import {
  taliseBio, taliseStreamingStats, taliseRelationships,
  lukeBio, lukeMetrics, lukePipeline,
  activities
} from '../../config/mockData';
import { LeadPipeline } from '../talent/LeadPipeline';
import { Bot, Sparkles, Music, Piano, Clock } from 'lucide-react';

const musicActivities = activities.filter(a => ['music', 'composer'].includes(a.vertical));

// ─── Luke pipeline stages display ────────────────────────────────────────────

const LUKE_STAGES = [
  { key: 'prospecting', label: 'Prospecting' },
  { key: 'pitched',     label: 'Pitched' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'closed',      label: 'Closed' },
];

const lukeStageBadge = {
  prospecting: 'bg-zinc-700 text-zinc-300',
  pitched:     'bg-blue-500/10 text-blue-400',
  negotiating: 'bg-amber-500/10 text-amber-400',
  closed:      'bg-emerald-500/10 text-emerald-400',
};

// ─── Talise streaming stats ───────────────────────────────────────────────────

const TaliseOverview = () => (
  <div className="space-y-5">
    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Bio</div>
      <p className="text-sm text-zinc-300 leading-relaxed">{taliseBio}</p>
    </div>

    <div className="grid grid-cols-4 gap-4">
      {taliseStreamingStats.map(s => (
        <div key={s.platform} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1.5 leading-snug">{s.platform}</div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{s.value}</div>
          <div className="text-xs text-emerald-400 mt-0.5 font-medium">{s.change}</div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800/60">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Relationships</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="text-left py-2.5 px-5 font-medium">Name</th>
              <th className="text-left py-2.5 px-4 font-medium">Role</th>
              <th className="text-left py-2.5 px-4 font-medium">Platform</th>
              <th className="text-left py-2.5 px-4 font-medium">Status</th>
              <th className="text-left py-2.5 px-4 font-medium">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {taliseRelationships.map((r, i) => (
              <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                <td className="py-2.5 px-5 text-zinc-200 font-medium">{r.name}</td>
                <td className="py-2.5 px-4 text-zinc-400">{r.role}</td>
                <td className="py-2.5 px-4 text-zinc-400">{r.platform}</td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                  }`}>{r.status}</span>
                </td>
                <td className="py-2.5 px-4 text-zinc-400 text-xs">{r.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Luke pipeline ────────────────────────────────────────────────────────────

const LukeOverview = ({ onAgentClick }) => (
  <div className="space-y-5">
    <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Bio</div>
      <p className="text-sm text-zinc-300 leading-relaxed">{lukeBio}</p>
    </div>

    <div className="grid grid-cols-4 gap-4">
      {lukeMetrics.map(m => (
        <div key={m.label} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-4">
          <div className="text-xs text-zinc-500 mb-1.5">{m.label}</div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{m.value}</div>
        </div>
      ))}
    </div>

    {/* Pipeline */}
    <div className="grid grid-cols-4 gap-4">
      {LUKE_STAGES.map(stage => {
        const leads = lukePipeline[stage.key] || [];
        return (
          <div key={stage.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${lukeStageBadge[stage.key]}`}>
                {stage.label}
              </span>
              <span className="text-xs font-mono text-zinc-500">{leads.length}</span>
            </div>
            <div className="space-y-2">
              {leads.map((lead, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl ring-1 ring-zinc-800 p-3">
                  <div className="text-xs font-semibold text-zinc-200 mb-1 leading-snug">{lead.title}</div>
                  <div className="text-xs text-zinc-500 mb-1">{lead.director}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{lead.budget}</span>
                    {lead.genre && <span className="text-xs text-zinc-600">{lead.genre}</span>}
                  </div>
                  {lead.proposedFee && (
                    <div className="text-xs text-amber-400 font-medium mt-1">{lead.proposedFee}</div>
                  )}
                  {lead.fee && (
                    <div className="text-xs text-emerald-400 font-medium mt-1">{lead.fee}</div>
                  )}
                  {lead.daysInStage !== undefined && (
                    <div className="flex items-center gap-1 mt-1.5 text-zinc-600">
                      <Clock size={9} /><span className="text-xs">{lead.daysInStage}d</span>
                    </div>
                  )}
                </div>
              ))}
              {leads.length === 0 && (
                <div className="rounded-xl ring-1 ring-zinc-800 p-3 text-center text-xs text-zinc-600">Empty</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Main view ────────────────────────────────────────────────────────────────

export const MusicView = ({ onAgentClick }) => {
  const [talent, setTalent] = useState('talise'); // 'talise' | 'luke'
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Activity'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Music & Composition</h1>
          <p className="text-sm text-zinc-500 mt-1">
            AI-driven composer matching, sync licensing, and scoring workflow management for film and media projects.
          </p>
        </div>
        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
          Vertical C
        </span>
      </div>

      {/* AI Music & Composition Engine banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-100">AI Music & Composition Engine — Online</span>
            <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
              <Sparkles size={9} /> AI
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-snug">
            Connects filmmakers with composers and scoring talent. Manages sync licensing opportunities, scoring workflows, and music deliverables end-to-end.
            Luke → AI-matched to indie films in pre-production via IMDb Pro and Film Freeway.
            Talise → sync pitches to supervisors, brand partnerships, and editorial playlist placements.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-zinc-500">Active deals</div>
          <div className="text-lg font-bold font-mono text-amber-400">$127.5K</div>
        </div>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTalent('talise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            talent === 'talise'
              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Music size={15} />
          Talise
          <span className="text-xs font-normal text-zinc-500">Sync Artist</span>
        </button>
        <button
          onClick={() => setTalent('luke')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            talent === 'luke'
              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Piano size={15} />
          Luke Mulholland
          <span className="text-xs font-normal text-zinc-500">Film Composer</span>
        </button>
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
                  ? 'text-amber-400 border-amber-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'Overview' && (
        talent === 'talise'
          ? <TaliseOverview />
          : <LukeOverview onAgentClick={onAgentClick} />
      )}

      {activeTab === 'Activity' && (
        <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <h3 className="text-sm font-semibold text-zinc-100">Recent Agent Activity</h3>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {musicActivities.map((a, i) => (
              <div key={i} className="flex gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
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
            {musicActivities.length === 0 && (
              <div className="px-5 py-6 text-sm text-zinc-500">No recent activity.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
