import React from 'react';
import { KPICard } from './KPICard';
import { EngagementChart } from './EngagementChart';
import { ActivityFeed } from './ActivityFeed';
import { AgentStatusGrid } from './AgentStatusGrid';
import { kpiData, generateChartData, activities, campaigns } from '../../config/mockData';
import { Calendar } from 'lucide-react';

export const Dashboard = ({ onAgentClick }) => {
  const chartData = generateChartData();
  const activeCampaignCount = campaigns.filter(c => c.status === 'Active').length;

  const allKpis = [
    ...kpiData,
    {
      id: 'campaigns',
      title: 'Active Campaigns',
      value: String(activeCampaignCount),
      change: '+1 this month',
      changeDirection: 'up',
      subtitle: 'Across all verticals',
      icon: 'Megaphone',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track performance across all your entertainment assets</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-3 py-1.5 rounded-lg">
          <Calendar size={14} />
          <span>Last 30 days</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Key Metrics</p>
        <div className="grid grid-cols-4 gap-4">
          {allKpis.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>
      </div>

      {/* Engagement Chart */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Engagement</p>
        <EngagementChart data={chartData} />
      </div>

      {/* Agent Fleet + Activity Feed */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Operations</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <AgentStatusGrid onAgentClick={onAgentClick} />
          </div>
          <div className="col-span-1">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
};
