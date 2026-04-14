import React, { useState } from 'react';
import { lukeBio, lukeMetrics, lukePipeline } from '../../config/mockData';
import { LeadPipeline } from './LeadPipeline';

const tabs = ['Overview', 'Lead Pipeline', 'Portfolio & SEO', 'Revenue'];

export const LukeView = ({ onAgentClick }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-emerald-500 border-emerald-500'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Bio</h3>
            <p className="text-zinc-300 leading-relaxed">{lukeBio}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {lukeMetrics.map((metric, index) => (
              <div key={index} className="bg-zinc-900 rounded-xl p-5 border border-l-4 border-l-emerald-500 border-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{metric.label}</div>
                <div className="text-2xl font-bold font-mono text-zinc-100">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Lead Pipeline' && (
        <LeadPipeline pipeline={lukePipeline} onAgentClick={onAgentClick} />
      )}

      {activeTab === 'Portfolio & SEO' && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Portfolio & SEO</h3>
          <p className="text-zinc-500">Portfolio entries and SEO scores will appear here</p>
        </div>
      )}

      {activeTab === 'Revenue' && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Revenue</h3>
          <p className="text-zinc-500">Revenue charts and project breakdown will appear here</p>
        </div>
      )}
    </div>
  );
};