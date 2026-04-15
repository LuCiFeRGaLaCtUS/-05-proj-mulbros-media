import React from 'react';
import { LukeView } from '../talent/LukeView';

export const LukePageView = ({ onAgentClick }) => (
  <div className="space-y-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Luke Mulholland</h1>
        <p className="text-sm text-zinc-500 mt-1">Berklee-trained film/TV composer · Boston · Last County (Hulu) · Heaven is for Real (Sony)</p>
      </div>
      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
        Talent OS — Composer
      </span>
    </div>
    <LukeView onAgentClick={onAgentClick} />
  </div>
);
