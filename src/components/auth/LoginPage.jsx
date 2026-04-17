import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Film, Mail, Lock, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [mode,     setMode]     = useState('password'); // 'password' | 'magic'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [sent,     setSent]     = useState(false);       // magic link sent state

  const handlePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // only existing accounts can use magic link
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSent(false);
  };

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

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-6">
          <button
            onClick={() => switchMode('password')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              mode === 'password'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Lock size={12} />
            Password
          </button>
          <button
            onClick={() => switchMode('magic')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              mode === 'magic'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles size={12} />
            Magic Link
          </button>
        </div>

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

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
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Magic Link form */}
        {mode === 'magic' && (
          <>
            {sent ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Mail size={20} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-100">Check your inbox</p>
                <p className="text-xs text-zinc-500">
                  We sent a login link to <span className="text-zinc-300">{email}</span>.
                  It expires in 1 hour.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    autoComplete="email"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

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
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>

                <p className="text-center text-xs text-zinc-600">
                  A one-click login link will be sent to your email
                </p>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
