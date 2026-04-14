import React from 'react';

export const IntegrationToggles = () => {
  const [integrations, setIntegrations] = React.useState({
    Spotify: false,
    YouTube: false,
    Instagram: false,
    TikTok: false,
    Hulu: false,
    Mailchimp: false,
    'IMDb Pro': false,
    Slack: false,
    'Google Analytics': false,
    'Movie Magic Budgeting': false
  });

  const toggle = (name) => {
    setIntegrations(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const list = Object.entries(integrations).map(([name, connected]) => ({
    name,
    description: getDescription(name),
    connected
  }));

  function getDescription(name) {
    const descriptions = {
      Spotify: 'Track streaming metrics',
      YouTube: 'Video analytics & uploads',
      Instagram: 'Post scheduling & analytics',
      TikTok: 'Video publishing & metrics',
      Hulu: 'Streaming viewership data',
      Mailchimp: 'Email campaigns & newsletters',
      'IMDb Pro': 'Production database for Luke\'s leads',
      Slack: 'Team notifications',
      'Google Analytics': 'Website & landing page tracking',
      'Movie Magic Budgeting': 'Film budget integration'
    };
    return descriptions[name] || '';
  }

  return (
    <div className="space-y-3">
      {list.map((item) => (
        <div key={item.name} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-zinc-200">{item.name}</div>
            <div className="text-xs text-zinc-500">{item.description}</div>
          </div>
          <button
            onClick={() => toggle(item.name)}
            className={`w-12 h-6 rounded-full transition-all ${
              item.connected ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-all shadow ${
              item.connected ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      ))}
    </div>
  );
};