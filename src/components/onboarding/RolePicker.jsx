import React, { useState } from 'react';
import { Briefcase, User, Users, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Step-0 role picker before vertical selection.
 * Maps to profile.roles text[]:
 *   - 'creator' (just creative artist — solo, no agency/talent mgmt) → []
 *   - 'talent' (individual signed actor/musician working through reps) → ['talent']
 *   - 'agency' (managing roster of talents) → ['agency']
 *   - 'both' (wears both hats, e.g. MulBros customer 0) → ['agency','talent']
 *
 * Sidebar grouping + dashboard tiles read `profile.roles` to switch surfaces.
 */
const ROLE_OPTIONS = [
  {
    id: 'creator',
    label: 'Creator',
    sub: 'I create the work',
    description: 'Solo creative — filmmaker, musician, writer, artist. Use the OS for your own projects and pipelines.',
    Icon: Sparkles,
    accent: { border: 'border-amber-400', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    roles: [],
  },
  {
    id: 'talent',
    label: 'Talent',
    sub: 'I work with reps',
    description: 'Working talent — actor, musician, performer. Track auditions, self-tapes, agent comms, income & taxes.',
    Icon: User,
    accent: { border: 'border-sky-400', bg: 'bg-sky-50', iconBg: 'bg-sky-100', iconText: 'text-sky-600' },
    roles: ['talent'],
  },
  {
    id: 'agency',
    label: 'Agency',
    sub: 'I manage talents',
    description: 'Talent agency or manager — manage roster, scout opportunities, draft submissions, track commissions.',
    Icon: Briefcase,
    accent: { border: 'border-violet-400', bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
    roles: ['agency'],
  },
  {
    id: 'both',
    label: 'Both',
    sub: 'I do both',
    description: 'Wearing both hats — running an agency while also working as talent. Full access to both surfaces.',
    Icon: Users,
    accent: { border: 'border-emerald-400', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    roles: ['agency', 'talent'],
  },
];

export const RolePicker = ({ onSelect, onSkip }) => {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    const option = ROLE_OPTIONS.find(o => o.id === selected);
    onSelect({ roleId: option.id, roles: option.roles });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F7FA' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-8 pb-6 text-center max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-zinc-950"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 0 16px rgba(245,158,11,0.30)' }}
          >
            M
          </div>
          <span className="text-zinc-900 font-bold text-sm tracking-tight">MulBros Media OS</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          What brings you here?
        </h1>
        <p className="text-zinc-600 mb-2 max-w-xl mx-auto">
          Pick the role that fits best — we'll tailor the workspace to it. You can change this later.
        </p>
        <p className="text-xs text-zinc-500 mb-8" style={{ fontFamily: 'var(--font-mono)' }}>
          STEP 1 OF 4
        </p>
      </div>

      {/* ── Role cards ───────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-32 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLE_OPTIONS.map(opt => {
            const Icon = opt.Icon;
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                data-testid={`role-${opt.id}`}
                onClick={() => setSelected(opt.id)}
                className={`relative text-left bg-white rounded-2xl p-5 transition-all duration-200 border-2 ${
                  isSelected
                    ? `${opt.accent.border} ${opt.accent.bg} shadow-lg`
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 size={20} className={`absolute top-4 right-4 ${opt.accent.iconText}`} />
                )}
                <div className={`w-10 h-10 rounded-xl ${opt.accent.iconBg} ${opt.accent.iconText} flex items-center justify-center mb-3`}>
                  <Icon size={20} />
                </div>
                <div className="text-base font-bold text-zinc-900 mb-0.5">{opt.label}</div>
                <div className="text-xs text-zinc-500 mb-2 font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                  {opt.sub}
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sticky bottom CTA bar ──────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-zinc-200"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500">
              {selected
                ? <span>Selected: <span className="font-semibold text-zinc-800">{ROLE_OPTIONS.find(o => o.id === selected)?.label}</span></span>
                : 'Pick a role to continue'}
            </p>
            {onSkip && (
              <button
                data-testid="role-skip"
                onClick={onSkip}
                className="text-xs text-zinc-600 hover:text-zinc-600 transition-colors underline"
              >
                Skip for now
              </button>
            )}
          </div>
          <button
            data-testid="role-continue"
            onClick={handleContinue}
            disabled={!selected}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              selected
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-200 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
