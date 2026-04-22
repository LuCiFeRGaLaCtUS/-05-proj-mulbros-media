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
      <div className="border-b border-zinc-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              className={`py-3 px-1 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'text-amber-600 border-amber-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden space-y-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
          {[
            { key: 'organization', label: 'Organization' },
            { key: 'engagementType', label: 'Engagement Type' },
            { key: 'vendor', label: 'Vendor' },
            { key: 'methodology', label: 'Methodology' },
          ].map(({ key, label }) => (
            <div key={key} className="relative z-10">
              <label className="block text-sm font-medium text-zinc-700 mb-2">{label}</label>
              <input
                type="text"
                value={settings[key]}
                onChange={(e) => { setSettings({ ...settings, [key]: e.target.value }); setIsDirty(true); }}
                className="w-full bg-white text-zinc-900 rounded-lg px-4 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm placeholder:text-zinc-400"
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
        <div className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
          {[
            { key: 'inApp',              label: 'In-App Notifications',  description: 'Show notifications within the app'   },
            { key: 'email',              label: 'Email Alerts',          description: 'Receive alerts via email'             },
            { key: 'slack',              label: 'Slack Notifications',   description: 'Send alerts to Slack channel'        },
            { key: 'dailyDigest',        label: 'Daily Digest',          description: 'Receive daily summary'               },
            { key: 'agentErrors',        label: 'Agent Error Alerts',    description: 'Alert when agent encounters error'   },
            { key: 'campaignMilestones', label: 'Campaign Milestones',   description: 'Alert on campaign milestones'        }
          ].map((item) => (
            <div key={item.key} className="relative z-10 flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all border border-zinc-100 hover:border-amber-500/20">
              <div>
                <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                <div className="text-xs text-zinc-500">{item.description}</div>
              </div>
              <button
                onClick={() => {
                  setNotifications(prev => {
                    const next = { ...prev, [item.key]: !prev[item.key] };
                    saveSettings(settings, next); // auto-persist immediately on toggle
                    return next;
                  });
                  setIsDirty(true);
                }}
                className={`w-12 h-6 rounded-full transition-all ${notifications[item.key] ? 'bg-emerald-500' : 'bg-zinc-200'}`}
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
            isDirty ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
          }`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
