import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { contentTypes, tones } from '../../config/mockData';

export const BriefPanel = ({ target, setTarget, contentType, setContentType, tone, setTone, additionalContext, setAdditionalContext, onGenerate, isGenerating }) => {
  const targets = Object.keys(contentTypes);

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 h-full">
      <h3 className="text-lg font-semibold text-zinc-100 mb-6">Content Brief</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-2">Target</label>
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setContentType(contentTypes[e.target.value][0]);
            }}
            className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all"
          >
            {targets.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-2">Content Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all"
          >
            {contentTypes[target]?.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-2">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all"
          >
            {tones.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-2">Additional Context (Optional)</label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any specific requirements or notes..."
            className="w-full bg-zinc-800 text-zinc-200 rounded-lg px-4 py-3 border border-zinc-700/50 focus:outline-none focus:border-amber-500/50 transition-all resize-none h-24"
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 font-semibold rounded-lg px-6 py-3 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            'Generate Content'
          )}
        </button>
      </div>
    </div>
  );
};