import React from 'react';
import { TaliseView } from '../talent/TaliseView';

export const TalisePageView = ({ onAgentClick }) => (
  <div className="space-y-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Talise</h1>
        <p className="text-sm text-zinc-500 mt-1">Canadian country-folk-Americana artist · WME represented · SXSW 2026</p>
      </div>
      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
        Talent OS — Music
      </span>
    </div>
    <TaliseView onAgentClick={onAgentClick} />
  </div>
);
