import React, { useState } from 'react';
import { taliseBio, taliseStreamingStats, taliseRelationships } from '../../config/mockData';
import { LeadPipeline } from './LeadPipeline';

const tabs = ['Overview', 'Content Calendar', 'Streaming & Revenue', 'Relationships'];

export const TaliseView = () => {
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
                  ? 'text-amber-500 border-amber-500'
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
            <p className="text-zinc-300 leading-relaxed">{taliseBio}</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {taliseStreamingStats.map((stat, index) => (
              <div key={index} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">{stat.platform}</div>
                <div className="text-2xl font-bold font-mono text-zinc-100">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Content Calendar' && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-zinc-100">Content Calendar</h3>
            <button className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-2 transition-all">
              Auto-Generate Week
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1;
              const hasContent = Math.random() > 0.5;
              return (
                <div
                  key={i}
                  className="bg-zinc-800 rounded-lg p-3 min-h-[80px] border border-zinc-700/50"
                >
                  <div className="text-xs text-zinc-500 mb-2">{day}</div>
                  {hasContent && (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Streaming & Revenue' && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Streaming Revenue</h3>
          <p className="text-zinc-500">Streaming analytics and revenue charts will appear here</p>
        </div>
      )}

      {activeTab === 'Relationships' && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Platform</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Last Contact</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {taliseRelationships.map((rel, index) => (
                <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4 text-sm text-zinc-200">{rel.name}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400">{rel.role}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400">{rel.platform}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rel.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {rel.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-500">{rel.lastContact}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400">{rel.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};