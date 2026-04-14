import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CampaignCard } from './CampaignCard';
import { CampaignBuilder } from './CampaignBuilder';
import { campaigns as mockCampaigns } from '../../config/mockData';

export const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleCreateCampaign = (newCampaign) => {
    setCampaigns([...campaigns, { ...newCampaign, id: `campaign-${Date.now()}` }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">Active Campaigns</h2>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-2 transition-all"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      <CampaignBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onCreate={handleCreateCampaign}
      />
    </div>
  );
};