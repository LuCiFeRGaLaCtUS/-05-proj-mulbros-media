import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ONBOARDING_QUESTIONS } from '../../config/onboardingQuestions';
import { VERTICALS } from '../../config/verticals';

// ── Step indicator ─────────────────────────────────────────────────────────────
const StepDot = ({ number, status }) => {
  if (status === 'done') {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">
        ✓
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-amber-500/30">
        {number}
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 text-xs font-bold">
      {number}
    </div>
  );
};

const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center gap-1.5 mb-6">
    {Array.from({ length: totalSteps }, (_, i) => {
      const num = i + 1;
      const status = num < currentStep ? 'done' : num === currentStep ? 'active' : 'pending';
      return (
        <React.Fragment key={num}>
          <StepDot number={num} status={status} />
          {num < totalSteps && (
            <div
              className={`w-10 h-0.5 rounded-full transition-colors duration-300 ${
                num < currentStep ? 'bg-amber-400' : 'bg-zinc-200'
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Question card ──────────────────────────────────────────────────────────────
const QuestionCard = ({ question, selectedOption, onSelect }) => (
  <div
    className="bg-white rounded-2xl p-6 border border-zinc-200"
    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
  >
    <h3 className="font-semibold text-zinc-900 text-base mb-4 leading-snug">
      {question.question}
    </h3>
    <div className="flex flex-wrap gap-2">
      {question.options.map((opt) => {
        const isSelected = selectedOption === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(question.id, opt)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
              isSelected
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-white'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * ProfileQuestions — renders 2 questions for the given pageIndex (0 = Q1+Q2, 1 = Q3+Q4)
 *
 * Props:
 *   vertical       — vertical id string
 *   pageIndex      — 0 | 1
 *   currentStep    — 2 | 3  (for the step indicator)
 *   totalSteps     — 4
 *   isLastPage     — boolean; shows "Complete" instead of "Next"
 *   initialAnswers — { [questionId]: selectedOption } (carry-over from previous page)
 *   onNext(answers)  — called with merged answers when user proceeds
 *   onBack()         — navigate back
 */
export const ProfileQuestions = ({
  vertical,
  pageIndex,
  currentStep,
  totalSteps,
  isLastPage,
  initialAnswers = {},
  onNext,
  onBack,
  onSkip,
}) => {
  const allQuestions = ONBOARDING_QUESTIONS[vertical] || [];
  const questions    = allQuestions.slice(pageIndex * 2, pageIndex * 2 + 2);
  const verticalInfo = VERTICALS.find(v => v.id === vertical);

  const [answers, setAnswers] = useState(initialAnswers);

  const answeredCount = questions.filter(q => answers[q.id]).length;
  const canProceed    = answeredCount === questions.length;

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (!canProceed) return;
    // Pass merged answers (includes carry-over + new selections)
    onNext({ ...initialAnswers, ...answers });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F7FA' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-8 pb-5 text-center max-w-3xl mx-auto w-full">

        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-zinc-950"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              boxShadow: '0 0 16px rgba(245,158,11,0.30)',
            }}
          >
            M
          </div>
          <span
            className="text-sm font-black tracking-[0.22em]"
            style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}
          >
            MULBROS
          </span>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <h1
          className="font-display font-semibold leading-tight mb-2"
          style={{ fontSize: '2rem', color: '#18181B', letterSpacing: '0.01em' }}
        >
          {isLastPage ? 'Almost done' : 'Tell us about your work'}
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          {verticalInfo && (
            <>
              As a{' '}
              <span className="font-semibold text-zinc-700">{verticalInfo.label}</span>
              {' '}— select the option that best fits.
            </>
          )}
        </p>
      </div>

      {/* ── Question cards ───────────────────────────────────────────────── */}
      <div className="flex-1 px-4 sm:px-6 pb-28 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          {questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              selectedOption={answers[q.id]}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Progress hint */}
        {answeredCount > 0 && answeredCount < questions.length && (
          <p
            className="text-center text-xs text-zinc-400 mt-5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {answeredCount} of {questions.length} answered — answer all to continue
          </p>
        )}
      </div>

      {/* ── Sticky bottom bar ───────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-zinc-200"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">

          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onSkip}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline hidden sm:block"
            >
              Skip for now
            </button>
            <span
              className="text-xs text-zinc-400 hidden sm:block"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {answeredCount}/{questions.length} answered
            </span>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                canProceed
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isLastPage ? (
                <>
                  Complete
                  <CheckCircle2 size={15} />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
