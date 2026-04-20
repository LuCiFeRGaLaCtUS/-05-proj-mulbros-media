import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Film, Mail, Lock, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';

// ── Shared input component ────────────────────────────────────────────────────
const Input = ({ icon: Icon, type = 'text', placeholder, value, onChange, autoComplete, rightSlot }) => (
  <div className="relative">
    <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      autoComplete={autoComplete}
      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
    />
    {rightSlot && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightSlot}
      </div>
    )}
  </div>
);

// ── Sign In form ──────────────────────────────────────────────────────────────
// ── Forgot Password flow ──────────────────────────────────────────────────────
const ForgotPasswordForm = ({ onBack }) => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
          <p className="text-sm font-semibold text-zinc-100 mb-1">Reset link sent</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Check your inbox at{' '}
            <span className="text-zinc-300 font-medium">{email}</span>.<br />
            Click the link to set a new password.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          ← Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-100 mb-1">Reset your password</p>
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
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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
          className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
        >
          ← Back to Sign In
        </button>
      </form>
    </div>
  );
};

// ── Sign In form ──────────────────────────────────────────────────────────────
const SignInForm = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [forgotMode,   setForgotMode]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
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
        {/* Forgot password link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setForgotMode(true); setError(''); }}
            className="text-xs text-zinc-500 hover:text-amber-400 transition-colors pr-1"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [sent,      setSent]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin, // redirect back to app after verification
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
          <p className="text-sm font-semibold text-zinc-100 mb-1">Check your inbox</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-zinc-300 font-medium">{email}</span>.
            <br />Click it to activate your account, then sign in.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setEmail(''); setPassword(''); setConfirm(''); }}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Use a different email
        </button>
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
      <Input
        icon={Lock}
        type={showCf ? 'text' : 'password'}
        placeholder="Confirm new password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        autoComplete="new-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowCf(v => !v)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            tabIndex={-1}
          >
            {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      />

      {/* Password strength hint */}
      {password && (
        <div className="flex gap-1 px-0.5">
          {[...Array(4)].map((_, i) => {
            const strength = Math.min(
              Math.floor(password.length / 3) +
              (/[A-Z]/.test(password) ? 1 : 0) +
              (/[0-9!@#$%^&*]/.test(password) ? 1 : 0),
              4
            );
            return (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  i < strength
                    ? strength <= 1 ? 'bg-red-500'
                    : strength <= 2 ? 'bg-amber-500'
                    : strength <= 3 ? 'bg-yellow-400'
                    : 'bg-emerald-500'
                    : 'bg-zinc-800'
                }`}
              />
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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

      <p className="text-center text-xs text-zinc-600">
        A verification link will be sent to your email
      </p>
    </form>
  );
};

// ── Main Login Page ───────────────────────────────────────────────────────────
export const LoginPage = () => {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060508] p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Film size={24} className="text-amber-400" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-zinc-100 tracking-wide">
            MULBROS
          </h1>
          <p className="text-xs text-zinc-500 mt-1 tracking-[0.2em] uppercase font-mono">
            Media OS · Studio Access
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-6">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'signin'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LogIn size={12} />
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'signup'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
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
