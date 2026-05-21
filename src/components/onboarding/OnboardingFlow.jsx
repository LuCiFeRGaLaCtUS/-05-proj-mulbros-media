import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RolePicker }        from './RolePicker';
import { VerticalSelect }    from './VerticalSelect';
import { ProfileQuestions }  from './ProfileQuestions';
import { useAppContext }      from '../../App';

const TOTAL_STEPS = 4; // 1=role, 2=vertical, 3=Q1+Q2, 4=Q3+Q4 then save

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

// ── Admin email allowlist (comma-separated env var) ─────────────────────────
// VITE_ADMIN_EMAILS="alice@x.com,bob@x.com" — case-insensitive
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// ── Main flow ──────────────────────────────────────────────────────────────────
export const OnboardingFlow = () => {
  const { updateProfile, user } = useAppContext();

  // step 0 → role picker (Creator / Talent / Agency / Both)
  // step 1 → vertical picker
  // step 2 → Q1 + Q2
  // step 3 → Q3 + Q4  (last question page)
  const [step,             setStep]             = useState(0);
  const [selectedRoleId,   setSelectedRoleId]   = useState(null);
  const [selectedRoles,    setSelectedRoles]    = useState([]);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [allAnswers,       setAllAnswers]       = useState({});
  const [saving,           setSaving]           = useState(false);

  // Step 0 → 1
  const handleRoleSelect = ({ roleId, roles }) => {
    setSelectedRoleId(roleId);
    setSelectedRoles(roles);
    setStep(1);
  };

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
    // Preserve existing roles when user didn't pick (e.g. admin re-runs onboarding).
    const rolesPatch = selectedRoles.length > 0 ? { roles: selectedRoles } : {};
    const { error } = await updateProfile({
      vertical:            selectedVertical,
      ...rolesPatch,
      onboarding_complete: true,
      onboarding_data:     { answers, role_id: selectedRoleId, skipped_questions: false },
    });
    setSaving(false);
    if (error) {
      console.error('onboarding.complete.failed', error);
      toast.error(`Could not save profile: ${error.message || 'unknown error'}`);
    }
    // On success App.jsx gate lifts automatically — profile.onboarding_complete is true
  };

  const handleSkip = async () => {
    setSaving(true);
    // Preserve existing roles when skipping (don't wipe pre-granted admin/super_admin).
    const rolesPatch = selectedRoles.length > 0 ? { roles: selectedRoles } : {};
    const { error } = await updateProfile({
      vertical:            selectedVertical || null,
      ...rolesPatch,
      onboarding_complete: true,
      onboarding_data:     { answers: allAnswers, role_id: selectedRoleId, skipped_questions: true },
    });
    setSaving(false);
    if (error) {
      console.error('onboarding.skip.failed', error);
      toast.error(`Could not skip onboarding: ${error.message || 'unknown error'}`);
    }
  };

  // Admin unlock — sets vertical='admin' + roles includes 'admin'.
  // Sidebar treats vertical='admin' as "show all verticals".
  // Server-side enforcement is via Supabase RLS (per-row user_id = auth.uid()),
  // so this is purely a UI affordance for trusted users to see every vertical.
  const handleAdminUnlock = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      vertical:            'admin',
      roles:               ['admin', 'agency', 'talent'],
      onboarding_complete: true,
      onboarding_data:     { answers: allAnswers, role_id: 'admin', admin_unlock: true, unlocked_at: new Date().toISOString() },
    });
    setSaving(false);
    if (error) {
      console.error('onboarding.admin.failed', error);
      toast.error(`Could not unlock admin: ${error.message || 'unknown error'}`);
    }
  };

  const userEmail = user?.emails?.[0]?.email;
  const showAdmin = isAdminEmail(userEmail);

  if (saving) return <SavingScreen />;

  // ── Step 0: role picker (Creator / Talent / Agency / Both) ─────────────────
  if (step === 0) {
    return (
      <RolePicker
        onSelect={handleRoleSelect}
        onSkip={handleSkip}
      />
    );
  }

  // ── Step 1: vertical picker ────────────────────────────────────────────────
  if (step === 1) {
    return (
      <VerticalSelect
        onSelect={handleVerticalSelect}
        onSkip={handleSkip}
        onAdminUnlock={showAdmin ? handleAdminUnlock : null}
      />
    );
  }

  // ── Step 2: Q1 + Q2 ───────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <ProfileQuestions
        vertical={selectedVertical}
        pageIndex={0}
        currentStep={3}
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
        currentStep={4}
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
