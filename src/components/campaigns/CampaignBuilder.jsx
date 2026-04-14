import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const CampaignBuilder = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    vertical: 'film',
    channels: [],
    startDate: '',
    endDate: '',
    objective: '',
    agent: ''
  });

  const verticals = ['Film', 'Music', 'Composer', 'Community'];
  const channelOptions = ['TikTok', 'Instagram', 'YouTube', 'Spotify', 'Email', 'LinkedIn', 'Cold Email', 'Blog'];
  const agentOptions = {
    film: 'Distribution Marketing Agent',
    music: 'Talise Marketing Agent',
    composer: 'Luke Sales Agent',
    community: 'Community Manager Agent'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    onCreate({
      ...formData,
      agent: agentOptions[formData.vertical],
      status: 'Active',
      metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
      progress: 0
    });
    toast.success('Campaign created successfully');
    onClose();
    setFormData({
      name: '',
      vertical: 'film',
      channels: [],
      startDate: '',
      endDate: '',
      objective: '',
      agent: ''
    });
  };

  const toggleChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-lg border border-zinc-800">
        <h3 className="text-xl font-semibold text-zinc-100 mb-6">New Campaign</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50"
              placeholder="Enter campaign name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Vertical *</label>
            <select
              value={formData.vertical}
              onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50"
            >
              {verticals.map(v => <option key={v} value={v.toLowerCase()}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map(channel => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    formData.channels.includes(channel)
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Objective</label>
            <textarea
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 h-24 resize-none"
              placeholder="What are the goals of this campaign?"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-4 py-3 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-3 transition-all"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};