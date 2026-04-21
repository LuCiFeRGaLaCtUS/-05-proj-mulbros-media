import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VerticalSelect }    from './VerticalSelect';
import { ProfileQuestions }  from './ProfileQuestions';
import { useAppContext }      from '../../App';

const TOTAL_STEPS = 4; // 1=vertical, 2=Q1+Q2, 3=Q3+Q4, 4=done

// ── Saving spinner ─────────────────────────────────────────────────────────────
const SavingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F7FA' }}>
    <div className="text-center">
      <Loader2 size={28} className="text-amber-500 animate-spin mx-auto mb-4" />
      <p className="text-sm text-zinc-500" style={{ fontFamily: 'var(--font-mono)' }}>
        Saving your profile…
      </p>
    </div>
  </div>
);

// ── Main flow ──────────────────────────────────────────────────────────────────
export const OnboardingFlow = () => {
  const { updateProfile } = useAppContext();

  // step 1 → vertical picker
  // step 2 → Q1 + Q2
  // step 3 → Q3 + Q4  (last question page)
  const [step,             setStep]             = useState(1);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [allAnswers,       setAllAnswers]       = useState({});
  const [saving,           setSaving]           = useState(false);

  // Step 1 → 2
  const handleVerticalSelect = (verticalId) => {
    setSelectedVertical(verticalId);
    setStep(2);
  };

  // Step 2 → 3, or Step 3 → save
  const handleQuestionsNext = (pageAnswers) => {
    const merged = { ...allAnswers, ...pageAnswers };
    setAllAnswers(merged);

    if (step === 2) {
      setStep(3);
    } else {
      // Last page — persist everything
      handleComplete(merged);
    }
  };

  const handleComplete = async (answers) => {
    setSaving(true);
    await updateProfile({
      vertical:            selectedVertical,
      onboarding_complete: true,
      onboarding_data:     { answers, skipped_questions: false },
    });
    setSaving(false);
    // App.jsx gate lifts automatically — profile.onboarding_complete is now true
  };

  const handleSkip = async () => {
    setSaving(true);
    await updateProfile({
      vertical:            selectedVertical || null,
      onboarding_complete: true,
      onboarding_data:     { answers: allAnswers, skipped_questions: true },
    });
    setSaving(false);
  };

  if (saving) return <SavingScreen />;

  // ── Step 1: vertical picker ────────────────────────────────────────────────
  if (step === 1) {
    return <VerticalSelect onSelect={handleVerticalSelect} onSkip={handleSkip} />;
  }

  // ── Step 2: Q1 + Q2 ───────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <ProfileQuestions
        vertical={selectedVertical}
        pageIndex={0}
        currentStep={2}
        totalSteps={TOTAL_STEPS}
        isLastPage={false}
        initialAnswers={allAnswers}
        onNext={handleQuestionsNext}
        onBack={() => setStep(1)}
        onSkip={handleSkip}
      />
    );
  }

  // ── Step 3: Q3 + Q4 (last page) ───────────────────────────────────────────
  if (step === 3) {
    return (
      <ProfileQuestions
        vertical={selectedVertical}
        pageIndex={1}
        currentStep={3}
        totalSteps={TOTAL_STEPS}
        isLastPage={true}
        initialAnswers={allAnswers}
        onNext={handleQuestionsNext}
        onBack={() => setStep(2)}
        onSkip={handleSkip}
      />
    );
  }

  // Fallback
  return <SavingScreen />;
};
