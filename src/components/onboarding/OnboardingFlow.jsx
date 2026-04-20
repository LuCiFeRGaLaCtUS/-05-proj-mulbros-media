import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VerticalSelect } from './VerticalSelect';
import { useAppContext } from '../../App';
import { VERTICALS } from '../../config/verticals';

// ── Step 2 placeholder — profile questions built on Day 3 ─────────────────────
const ProfileQuestionsPlaceholder = ({ vertical, onBack, onSkip }) => {
  const v = VERTICALS.find(v => v.id === vertical);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F7F7FA' }}>
      <div
        className="text-center max-w-md w-full mx-4 px-8 py-10 bg-white rounded-2xl border border-zinc-200"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fde68a' }}
        >
          <span className="text-2xl font-black text-amber-600">M</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-xs font-bold">1</div>
          <div className="w-12 h-0.5 bg-amber-400 rounded-full" />
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-amber-500/30">2</div>
        </div>

        <h2 className="font-display font-semibold text-2xl text-zinc-900 mb-2">
          Almost there
        </h2>
        <p className="text-zinc-500 text-sm leading-relaxed mb-2">
          You've selected{' '}
          <span className="font-semibold text-zinc-800">{v?.label ?? vertical}</span>.
        </p>
        <p className="text-zinc-400 text-xs leading-relaxed mb-8">
          Personalised profile questions for your vertical will be ready soon.
          You can skip now and fill them in later from Settings.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onSkip}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Saving spinner ─────────────────────────────────────────────────────────────
const SavingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F7FA' }}>
    <div className="text-center">
      <Loader2 size={28} className="text-amber-500 animate-spin mx-auto mb-4" />
      <p className="text-sm text-zinc-500 font-mono">Saving your profile…</p>
    </div>
  </div>
);

// ── Main flow ──────────────────────────────────────────────────────────────────
export const OnboardingFlow = () => {
  const { updateProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleVerticalSelect = (verticalId) => {
    setSelectedVertical(verticalId);
    setStep(2);
  };

  const handleSkip = async () => {
    if (!selectedVertical) return;
    setSaving(true);
    await updateProfile({
      vertical: selectedVertical,
      onboarding_complete: true,
      onboarding_data: { skipped_questions: true },
    });
    setSaving(false);
    // App.jsx re-renders automatically when profile.onboarding_complete becomes true
    // and the gate lifts — user lands on /dashboard
  };

  if (saving) return <SavingScreen />;

  if (step === 1) {
    return <VerticalSelect onSelect={handleVerticalSelect} />;
  }

  return (
    <ProfileQuestionsPlaceholder
      vertical={selectedVertical}
      onBack={() => setStep(1)}
      onSkip={handleSkip}
    />
  );
};
