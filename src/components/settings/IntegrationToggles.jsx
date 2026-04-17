import React from 'react';

const STORAGE_KEY = 'mulbros_integration_toggles';

const defaultIntegrations = {
  Spotify: false, YouTube: false, Instagram: false, TikTok: false,
  Hulu: false, Mailchimp: false, 'IMDb Pro': false, Slack: false,
  'Google Analytics': false, 'Movie Magic Budgeting': false
};

const loadIntegrations = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultIntegrations, ...JSON.parse(stored) };
  } catch (_) { /* ignore */ }
  return defaultIntegrations;
};

export const IntegrationToggles = () => {
  const [integrations, setIntegrations] = React.useState(loadIntegrations);

  const toggle = (name) => {
    setIntegrations(prev => {
      const next = { ...prev, [name]: !prev[name] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { /* ignore */ }
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
    <div className="relative bg-zinc-900 rounded-xl p-6 border border-amber-900/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-2">
        {Object.entries(integrations).map(([name, connected]) => (
          <div key={name} className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800/70 rounded-lg transition-all border border-transparent hover:border-amber-500/10">
            <div>
              <div className="text-sm font-medium text-zinc-200">{name}</div>
              <div className="text-xs text-zinc-500">{descriptions[name]}</div>
            </div>
            <button
              onClick={() => toggle(name)}
              aria-label={`${connected ? 'Disconnect' : 'Connect'} ${name}`}
              aria-pressed={connected}
              className={`w-12 h-6 rounded-full transition-all ${connected ? 'bg-emerald-500' : 'bg-zinc-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all shadow ${connected ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
