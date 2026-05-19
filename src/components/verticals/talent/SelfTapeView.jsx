import React, { useState } from 'react';
import { Video, Upload, Lightbulb, Mic, Camera } from 'lucide-react';
import { TalentAgentShell } from './TalentAgentShell';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const SelfTapeView = () => {
  const [setupDescription, setSetupDescription] = useState('');

  const handleAskCoach = () => {
    if (setupDescription.trim()) {
      sessionStorage.setItem('agentchat.prefill', `Review my self-tape setup: ${setupDescription}`);
    }
    sessionStorage.setItem('agentchat.preselectedAgent', 'talent-self-tape-coach');
    window.location.href = '/agents';
  };

  return (
    <TalentAgentShell
      title="Self-Tape Coach"
      description="Upload your self-tape and get AI feedback on framing, lighting, audio, and performance. Or describe your setup for text-based prep."
      Icon={Video}
      accentClass="text-sky-600"
      agentId="talent-self-tape-coach"
      agentLabel="Open Coach"
      features={[
        '4-dimensional review: framing · lighting · audio · performance',
        'Specific re-shoot adjustments (camera height, light placement, mic position)',
        'Slate guidance for cold reads',
        'Best practices by casting type (drama / comedy / commercial / VO)',
      ]}
      comingSoon={[
        'Mux video upload (Sprint 4)',
        'AI vision analysis of your tape (Sprint 4)',
        'A/B compare two takes',
        'Auto-generate slate variants',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Upload className="text-sky-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Quick prep — describe your setup</div>
        </div>
        <p className="text-sm text-zinc-500 mb-3">
          Until video upload ships, describe your camera, lighting, audio setup and the scene you're prepping.
          The coach will give targeted feedback.
        </p>
        <textarea
          value={setupDescription}
          onChange={(e) => setSetupDescription(e.target.value)}
          placeholder="e.g. Lumix S5 at eye level on tripod, soft key from window left, lav mic + Zoom H6 backup, 2-minute drama scene for a Netflix pilot — playing a 35-year-old detective in confrontation"
          rows={4}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <div className="flex gap-3 mt-3">
          <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500"><Camera size={12} /> Framing</div>
            <div className="flex items-center gap-1.5 text-zinc-500"><Lightbulb size={12} /> Lighting</div>
            <div className="flex items-center gap-1.5 text-zinc-500"><Mic size={12} /> Audio</div>
          </div>
          <button onClick={handleAskCoach}
            disabled={!setupDescription.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              setupDescription.trim()
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            Ask Coach
          </button>
        </div>
      </div>
    </TalentAgentShell>
  );
};
