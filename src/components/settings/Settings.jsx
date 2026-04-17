import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { APIKeyManager } from './APIKeyManager';
import { IntegrationToggles } from './IntegrationToggles';
import { TeamManager } from './TeamManager';
import { useUserSettings } from '../../hooks/useUserSettings';

const tabs = ['General', 'API Keys', 'Integrations', 'Team', 'Notifications'];

export const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isDirty, setIsDirty] = useState(false);

  const {
    settings, setSettings,
    notifications, setNotifications,
    saveSettings,
  } = useUserSettings(user?.id);

  const handleSave = async () => {
    const { error } = await saveSettings(settings, notifications);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      setIsDirty(false);
      toast.success('Settings saved successfully');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'text-amber-400 border-amber-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="relative bg-zinc-900 rounded-xl p-6 border border-amber-900/20 overflow-hidden space-y-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
          {[
            { key: 'organization', label: 'Organization' },
            { key: 'engagementType', label: 'Engagement Type' },
            { key: 'vendor', label: 'Vendor' },
            { key: 'methodology', label: 'Methodology' },
          ].map(({ key, label }) => (
            <div key={key} className="relative z-10">
              <label className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
              <input
                type="text"
                value={settings[key]}
                onChange={(e) => { setSettings({ ...settings, [key]: e.target.value }); setIsDirty(true); }}
                className="w-full bg-zinc-800/80 text-zinc-200 rounded-lg px-4 py-2 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'api-keys'      && <APIKeyManager />}
      {activeTab === 'integrations'  && <IntegrationToggles />}
      {activeTab === 'team'          && <TeamManager />}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="relative bg-zinc-900 rounded-xl p-6 border border-amber-900/20 overflow-hidden space-y-3">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
          {[
            { key: 'inApp',              label: 'In-App Notifications',  description: 'Show notifications within the app'   },
            { key: 'email',              label: 'Email Alerts',          description: 'Receive alerts via email'             },
            { key: 'slack',              label: 'Slack Notifications',   description: 'Send alerts to Slack channel'        },
            { key: 'dailyDigest',        label: 'Daily Digest',          description: 'Receive daily summary'               },
            { key: 'agentErrors',        label: 'Agent Error Alerts',    description: 'Alert when agent encounters error'   },
            { key: 'campaignMilestones', label: 'Campaign Milestones',   description: 'Alert on campaign milestones'        }
          ].map((item) => (
            <div key={item.key} className="relative z-10 flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800/70 rounded-lg transition-all border border-transparent hover:border-amber-500/10">
              <div>
                <div className="text-sm font-medium text-zinc-200">{item.label}</div>
                <div className="text-xs text-zinc-500">{item.description}</div>
              </div>
              <button
                onClick={() => { setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] })); setIsDirty(true); }}
                className={`w-12 h-6 rounded-full transition-all ${notifications[item.key] ? 'bg-emerald-500' : 'bg-zinc-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all shadow ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`font-semibold rounded-lg px-6 py-3 transition-all text-sm ${
            isDirty ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
