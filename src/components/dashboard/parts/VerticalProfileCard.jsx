import React, { useState } from 'react';
import { CheckCircle2, Layers, ChevronRight, Sparkles as SparklesIcon } from 'lucide-react';
import { useAppContext } from '../../../App';
import { VERTICALS } from '../../../config/verticals';
import { V_ICON, VERTICAL_PATH } from './constants';

export const VerticalProfileCard = () => {
  const { profile, navigate } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!profile?.vertical) return null;

  const vertInfo   = VERTICALS.find(v => v.id === profile.vertical);
  if (!vertInfo) return null;

  const Icon       = V_ICON[profile.vertical] || Layers;
  const neon       = vertInfo.neon;
  const answers    = profile.onboarding_data?.answers || {};
  const answerList = Object.values(answers).filter(Boolean).slice(0, 4);
  const isSkipped  = profile.onboarding_data?.skipped_questions;
  const path       = VERTICAL_PATH[profile.vertical] || '/dashboard';

  return (
    <div
      className="relative rounded-2xl overflow-hidden animate-hud-in"
      style={{
        background: `linear-gradient(135deg, ${neon}08 0%, #FFFFFF 60%)`,
        border: `1px solid ${neon}28`,
        boxShadow: `0 0 0 1px ${neon}10, 0 4px 20px rgba(0,0,0,0.05)`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${neon}60, transparent)` }}
      />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-600 hover:bg-zinc-100 transition-all z-10 text-xs font-bold"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="relative z-10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">

        <div className="flex items-center gap-4 flex-shrink-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${neon}14`,
              border: `1px solid ${neon}30`,
              boxShadow: `0 0 16px ${neon}15`,
            }}
          >
            <Icon size={26} style={{ color: neon }} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[11px] font-black uppercase tracking-[0.22em]"
                style={{ color: neon, fontFamily: 'var(--font-mono)' }}
              >
                Your Vertical
              </span>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${neon}12`,
                  border: `1px solid ${neon}28`,
                  color: neon,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: neon }} />
                Profile Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 leading-tight">{vertInfo.label}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{vertInfo.desc}</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {isSkipped ? (
            <p className="text-xs text-zinc-600 italic">
              Profile questions skipped — update anytime in Settings.
            </p>
          ) : answerList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {answerList.map((ans, i) => (
                <span
                  key={`${ans}-${i}`}
                  className="inline-flex text-xs font-medium px-3 py-1.5 rounded-xl border"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#52525b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <CheckCircle2 size={11} style={{ color: neon, marginRight: 5, flexShrink: 0, marginTop: 1 }} />
                  {ans}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0 sm:items-end w-full sm:w-auto">
          <button
            onClick={() => navigate(path)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ background: neon, boxShadow: `0 4px 12px ${neon}30` }}
          >
            Open Workspace
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => navigate('/agents')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <SparklesIcon size={11} />
            Talk to an agent
          </button>
        </div>
      </div>
    </div>
  );
};
