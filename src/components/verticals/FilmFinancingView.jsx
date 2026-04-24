import React, { useState } from 'react';
import { useFilmPipeline } from '../../hooks/useFilmPipeline';
import { useAppContext } from '../../App';
import { BlueBg } from './film/BlueBg';
import { kpis, financingActivities } from './film/constants';
import { LeadGenTab } from './film/LeadGenTab';
import { IncentiveAnalystTab } from './film/IncentiveAnalystTab';
import { PipelineTab } from './film/PipelineTab';
import { TiltCard } from '../ui/TiltCard';

const TABS = ['Lead Gen', 'Incentive Analyst', 'Pipeline', 'Activity'];

export const FilmFinancingView = ({ user }) => {
  const [activeTab, setActiveTab] = useState('Lead Gen');
  const { profile } = useAppContext();
  const { pipeline, setPipeline } = useFilmPipeline(profile?.id);

  const handleAddToPipeline = (lead) => {
    const card = {
      title:       lead.username,
      budget:      lead.budget,
      country:     lead.country || 'Unknown',
      source:      lead.source,
      signal:      lead.snippet ? lead.snippet.substring(0, 80) + '…' : '',
      daysInStage: 0,
    };
    setPipeline(prev => ({
      ...prev,
      discovery: [...(prev.discovery || []), card],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <TiltCard
        tiltLimit={6} scale={1.015} perspective={1400}
        className="tile-pop bg-white rounded-2xl p-5"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-24 bg-blue-100 blur-xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(59,130,246,0.04),transparent_70%)] pointer-events-none" />
        <div className="absolute top-1.5 left-0 right-0 flex gap-1.5 px-4 pointer-events-none opacity-10">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} className="flex-1 h-1.5 bg-zinc-400 rounded-[1px]" />)}
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-200 pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-blue-200 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Film Financing</h1>
            <p className="text-sm text-zinc-500 mt-1">
              AI-driven lead discovery → tax incentive modeling → production planning → qualified spend tracking → tax filing
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium">
            Vertical A
          </span>
        </div>
      </TiltCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div
            key={k.label}
            className="relative tile-pop bg-white rounded-2xl p-5 overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <BlueBg />
            <div className="relative z-10">
              <div className="text-3xl font-bold font-mono text-zinc-900 mb-1">{k.value}</div>
              <div className="text-sm font-medium text-zinc-700 mb-0.5">{k.label}</div>
              <div className="text-xs text-zinc-500">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Lead Gen' && <LeadGenTab onAddToPipeline={handleAddToPipeline} />}
      {activeTab === 'Incentive Analyst' && <IncentiveAnalystTab />}
      {activeTab === 'Pipeline' && <PipelineTab pipeline={pipeline} setPipeline={setPipeline} />}

      {/* Activity */}
      {activeTab === 'Activity' && (
        <div
          className="relative tile-pop bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <BlueBg />
          <div className="relative z-10 px-5 py-4 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-transparent">
            <h3 className="text-sm font-semibold text-zinc-900">Recent Agent Activity</h3>
          </div>
          <div className="relative z-10 divide-y divide-zinc-100">
            {financingActivities.map((a, i) => (
              <div key={a.id ?? `${a.agent}-${i}`} className="flex gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 leading-snug">{a.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">{a.agent}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-xs text-zinc-500">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {financingActivities.length === 0 && (
              <div className="px-5 py-6 text-sm text-zinc-500">No recent activity.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
