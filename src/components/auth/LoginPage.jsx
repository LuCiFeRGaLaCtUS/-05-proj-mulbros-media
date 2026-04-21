import React, { useState } from 'react';
import { useStytch } from '@stytch/react';
import { Loader2, Film, Mail, Lock, UserPlus, LogIn, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

// Canonical app URL for Stytch redirect URLs
const appUrl = () => import.meta.env.VITE_APP_URL || window.location.origin;

// ── Password strength helper ──────────────────────────────────────────────────
const calcStrength = (pw) =>
  Math.min(
    Math.floor(pw.length / 3) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9!@#$%^&*]/.test(pw) ? 1 : 0),
    4
  );

const StrengthBar = ({ password }) => {
  if (!password) return null;
  const strength = calcStrength(password);
  return (
    <div className="flex gap-1 px-0.5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 rounded-full transition-colors ${
            i < strength
              ? strength <= 1 ? 'bg-red-500'
              : strength <= 2 ? 'bg-amber-500'
              : strength <= 3 ? 'bg-yellow-400'
              : 'bg-emerald-500'
              : 'bg-zinc-200'
          }`}
        />
      ))}
    </div>
  );
};

// ── Shared input component ────────────────────────────────────────────────────
const Input = ({ icon: Icon, type = 'text', placeholder, value, onChange, autoComplete, rightSlot, disabled }) => (
  <div className="relative">
    <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      autoComplete={autoComplete}
      disabled={disabled}
      className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-10 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-60"
    />
    {rightSlot && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightSlot}
      </div>
    )}
  </div>
);

// ── Logo header — shared between LoginPage and ResetPasswordPage ──────────────
const LogoHeader = ({ subtitle }) => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
      <Film size={24} className="text-amber-400" />
    </div>
    <h1 className="font-display text-3xl font-black text-zinc-900 tracking-[0.18em]">
      MULBROS
    </h1>
    <p className="text-xs text-zinc-500 mt-1 tracking-[0.2em] uppercase font-mono">
      {subtitle}
    </p>
  </div>
);

// ── Forgot Password flow ──────────────────────────────────────────────────────
const ForgotPasswordForm = ({ onBack }) => {
  const stytch = useStytch();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await stytch.passwords.resetByEmailStart({
        email,
        reset_password_redirect_url: appUrl(),
        reset_password_expiration_minutes: 30,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Mail size={22} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 mb-1">Reset link sent</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Check your inbox at{' '}
            <span className="text-zinc-700 font-medium">{email}</span>.<br />
            Click the link to set a new password.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
        >
          ← Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900 mb-1">Reset your password</p>
        <p className="text-xs text-zinc-500">Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          icon={Mail}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs text-zinc-500 hover:text-zinc-700 transition-colors py-1"
        >
          ← Back to Sign In
        </button>
      </form>
    </div>
  );
};

// ── Sign In form ──────────────────────────────────────────────────────────────
const SignInForm = () => {
  const stytch = useStytch();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await stytch.passwords.authenticate({
        email,
        password,
        session_duration_minutes: 10080, // 7 days
      });
      // Session now active — useStytchSession fires, App reroutes to dashboard
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
    setLoading(false);
  };

  if (forgotMode) {
    return <ForgotPasswordForm onBack={() => setForgotMode(false)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />
      <div className="space-y-1">
        <Input
          icon={Lock}
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setForgotMode(true); setError(''); }}
            className="text-xs text-zinc-500 hover:text-amber-500 transition-colors pr-1"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-1 rounded-xl text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
};

// ── Sign Up form ──────────────────────────────────────────────────────────────
const SignUpForm = () => {
  const stytch = useStytch();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [sent,     setSent]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await stytch.passwords.create({
        email,
        password,
        // No session_duration_minutes — user must verify email first
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Mail size={22} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 mb-1">Check your inbox</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-zinc-700 font-medium">{email}</span>.<br />
            Click it to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />
      <Input
        icon={Lock}
        type={showPw ? 'text' : 'password'}
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
        rightSlot={
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors" tabIndex={-1}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />
      <Input
        icon={Lock}
        type={showCf ? 'text' : 'password'}
        placeholder="Confirm new password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        autoComplete="new-password"
        rightSlot={
          <button type="button" onClick={() => setShowCf(v => !v)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors" tabIndex={-1}>
            {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />

      <StrengthBar password={password} />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-1 rounded-xl text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-zinc-500">
        A verification link will be sent to your email
      </p>
    </form>
  );
};

// ── Reset Password Page ───────────────────────────────────────────────────────
// Rendered by App.jsx when URL contains stytch_token_type=reset_password.
// Stytch has already validated the link — we just call resetByEmail with the token.
export const ResetPasswordPage = () => {
  const stytch = useStytch();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await stytch.passwords.resetByEmail({
        token,
        password,
        session_duration_minutes: 10080,
      });
      setDone(true);
      // Session is now active. Clear the reset token from the URL so App.jsx
      // stops matching stytch_token_type=reset_password and routes to dashboard.
      setTimeout(() => {
        window.history.replaceState({}, '', '/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F7FA' }}>
      <div className="w-full max-w-sm">
        <LogoHeader subtitle="Media OS · Set New Password" />

        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">Password updated!</p>
            <p className="text-xs text-zinc-500">Taking you to your dashboard…</p>
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <KeyRound size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Choose a strong password — at least 8 characters with uppercase and numbers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                rightSlot={
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors" tabIndex={-1}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              <Input
                icon={Lock}
                type={showCf ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                rightSlot={
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors" tabIndex={-1}>
                    {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <StrengthBar password={password} />

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full py-3 mt-1 rounded-xl text-sm font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                {loading ? 'Updating password…' : 'Set new password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Login Page ───────────────────────────────────────────────────────────
export const LoginPage = () => {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F7FA' }}>
      <div className="w-full max-w-sm">
        <LogoHeader subtitle="Media OS · Studio Access" />

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-200 mb-6">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'signin'
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <LogIn size={12} />
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'signup'
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <UserPlus size={12} />
            Create Account
          </button>
        </div>

        {/* Forms */}
        {tab === 'signin' ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  );
};
