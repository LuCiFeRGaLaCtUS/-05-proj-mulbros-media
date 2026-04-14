import React from 'react';
import { KPICard } from './KPICard';
import { EngagementChart } from './EngagementChart';
import { ActivityFeed } from './ActivityFeed';
import { AgentStatusGrid } from './AgentStatusGrid';
import { kpiData, generateChartData, activities } from '../../config/mockData';

export const Dashboard = ({ onAgentClick }) => {
  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      <EngagementChart data={chartData} />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <AgentStatusGrid onAgentClick={onAgentClick} />
        </div>
        <div className="col-span-1">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
};