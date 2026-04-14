import React, { useState } from 'react';
import { TalentProfile } from './TalentProfile';
import { TaliseView } from './TaliseView';
import { LukeView } from './LukeView';

export const TalentManager = ({ onAgentClick }) => {
  const [selectedTalent, setSelectedTalent] = useState(null);

  const taliseTags = ['WME Represented', 'SXSW 2026', 'Spotify', 'YouTube'];
  const taliseMetrics = [
    { value: '85K', label: 'Spotify Listeners' },
    { value: '12K', label: 'YouTube Subs' },
    { value: '23K', label: 'Instagram' }
  ];

  const lukeTags = ['Last County', 'Heaven is for Real', 'Boston Music Awards', 'Berklee'];
  const lukeMetrics = [
    { value: '14', label: 'Active Leads' },
    { value: '8', label: 'Projects Scored' },
    { value: '$142K', label: 'Revenue' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <TalentProfile
          name="TALISE"
          subtitle="Indie Artist · Country/Folk/Americana"
          tags={taliseTags}
          metrics={taliseMetrics}
          color="amber"
          isSelected={selectedTalent === 'talise'}
          onClick={() => setSelectedTalent(selectedTalent === 'talise' ? null : 'talise')}
        />
        <TalentProfile
          name="LUKE MULHOLLAND"
          subtitle="Composer · Film/TV Scoring · Berklee Alumni"
          tags={lukeTags}
          metrics={lukeMetrics}
          color="emerald"
          isSelected={selectedTalent === 'luke'}
          onClick={() => setSelectedTalent(selectedTalent === 'luke' ? null : 'luke')}
        />
      </div>

      {selectedTalent === 'talise' && <TaliseView />}
      {selectedTalent === 'luke' && <LukeView onAgentClick={onAgentClick} />}
    </div>
  );
};