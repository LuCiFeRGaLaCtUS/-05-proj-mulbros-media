import React from 'react';
import toast from 'react-hot-toast';
import { logger } from '../../lib/logger';
import { STORAGE_KEYS } from '../../constants';

const STORAGE_KEY = STORAGE_KEYS.integrations;

const defaultIntegrations = {
  Spotify: false, YouTube: false, Instagram: false, TikTok: false,
  Hulu: false, Mailchimp: false, 'IMDb Pro': false, Slack: false,
  'Google Analytics': false, 'Movie Magic Budgeting': false
};

const loadIntegrations = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultIntegrations, ...JSON.parse(stored) };
  } catch (err) {
    logger.warn('IntegrationToggles.load.corrupt', { message: err.message });
  }
  return defaultIntegrations;
};

export const IntegrationToggles = () => {
  const [integrations, setIntegrations] = React.useState(loadIntegrations);

  const toggle = (name) => {
    setIntegrations(prev => {
      const next = { ...prev, [name]: !prev[name] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        logger.error('IntegrationToggles.save.failed', err);
        toast.error('Could not save integration preference. Storage may be full.');
      }
      return next;
    });
  };

  const descriptions = {
    Spotify: 'Track streaming metrics',
    YouTube: 'Video analytics & uploads',
    Instagram: 'Post scheduling & analytics',
    TikTok: 'Video publishing & metrics',
    Hulu: 'Streaming viewership data',
    Mailchimp: 'Email campaigns & newsletters',
    'IMDb Pro': "Production database for Luke's leads",
    Slack: 'Team notifications',
    'Google Analytics': 'Website & landing page tracking',
    'Movie Magic Budgeting': 'Film budget integration'
  };

  return (
    <div className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-2">
        {Object.entries(integrations).map(([name, connected]) => (
          <div key={name} className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all border border-zinc-100 hover:border-amber-500/20">
            <div>
              <div className="text-sm font-medium text-zinc-900">{name}</div>
              <div className="text-xs text-zinc-500">{descriptions[name]}</div>
            </div>
            <button
              onClick={() => toggle(name)}
              aria-label={`${connected ? 'Disconnect' : 'Connect'} ${name}`}
              aria-pressed={connected}
              className={`w-12 h-6 rounded-full transition-all ${connected ? 'bg-emerald-500' : 'bg-zinc-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all shadow ${connected ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
