import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { logger } from '../../lib/logger';
import { useAppContext } from '../../App';
import { useUserSettings } from '../../hooks/useUserSettings';

const DEFAULT_INTEGRATIONS = {
  Spotify: false, YouTube: false, Instagram: false, TikTok: false,
  Hulu: false, Mailchimp: false, 'IMDb Pro': false, Slack: false,
  'Google Analytics': false, 'Movie Magic Budgeting': false,
};

const DESCRIPTIONS = {
  Spotify: 'Track streaming metrics',
  YouTube: 'Video analytics & uploads',
  Instagram: 'Post scheduling & analytics',
  TikTok: 'Video publishing & metrics',
  Hulu: 'Streaming viewership data',
  Mailchimp: 'Email campaigns & newsletters',
  'IMDb Pro': 'Production database for Film/TV leads',
  Slack: 'Team notifications',
  'Google Analytics': 'Website & landing page tracking',
  'Movie Magic Budgeting': 'Film budget integration',
};

export const IntegrationToggles = () => {
  const { profile } = useAppContext();
  const { integrations, saveIntegrations, loading } = useUserSettings(profile?.id);

  // Merge defaults so newly added services show up for users with old rows
  const state = useMemo(() => ({ ...DEFAULT_INTEGRATIONS, ...(integrations || {}) }), [integrations]);

  const toggle = async (name) => {
    const next = { ...state, [name]: !state[name] };
    const { error } = await saveIntegrations(next);
    if (error) {
      logger.error('IntegrationToggles.save.failed', error);
      toast.error('Could not save integration preference.');
    }
  };

  return (
    <div className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-2">
        {loading && <div className="text-xs text-zinc-500 py-3">Loading integrations…</div>}
        {Object.entries(state).map(([name, connected]) => (
          <div key={name} className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all border border-zinc-100 hover:border-amber-500/20">
            <div>
              <div className="text-sm font-medium text-zinc-900">{name}</div>
              <div className="text-xs text-zinc-500">{DESCRIPTIONS[name]}</div>
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
