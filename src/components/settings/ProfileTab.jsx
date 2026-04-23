import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mail, User, Shield, LogOut, KeyRound, Copy, Check } from 'lucide-react';
import { stytch } from '../../lib/stytch';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { logger } from '../../lib/logger';

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">{label}</label>
    {children}
  </div>
);

const ReadOnlyRow = ({ label, value, copyable = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Clipboard unavailable');
    }
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 font-mono truncate">
          {value || <span className="text-zinc-400">Not set</span>}
        </div>
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg border border-zinc-200 hover:border-amber-500/50 hover:text-amber-600 text-zinc-500 transition-all"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </Field>
  );
};

export const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile(user);

  const [displayName, setDisplayName]   = useState('');
  const [organization, setOrganization] = useState('');
  const [saving, setSaving]             = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setOrganization(profile?.organization || '');
  }, [profile?.id]);

  const email     = user?.emails?.[0]?.email || '';
  const verified  = user?.emails?.[0]?.verified;
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleString() : '';

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName.trim() || null,
        organization: organization.trim() || null,
      });
      if (error) {
        // Column may not exist — surface to user without throwing
        if (String(error.message || '').toLowerCase().includes('column')) {
          toast.error('Profile columns missing in DB. Run migration to add display_name + organization.');
        } else {
          toast.error('Failed to save profile');
        }
        logger.error('ProfileTab.save.failed', error);
      } else {
        toast.success('Profile saved');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('No email on account');
      return;
    }
    setSendingReset(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await stytch.passwords.resetByEmailStart({
        email,
        login_redirect_url:          `${origin}/`,
        reset_password_redirect_url: `${origin}/reset-password`,
        reset_password_expiration_minutes: 30,
      });
      toast.success('Password reset email sent — check your inbox');
    } catch (err) {
      logger.error('ProfileTab.resetPassword.failed', err);
      toast.error(err?.message || 'Failed to send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out');
    } catch (err) {
      toast.error('Sign-out failed');
      logger.error('ProfileTab.signOut.failed', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Identity */}
      <section className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyRow label="Email" value={email} copyable />
            <Field label="Email verified">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${verified ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span className="text-zinc-900">{verified ? 'Verified' : 'Not verified'}</span>
              </div>
            </Field>
            <ReadOnlyRow label="Stytch User ID" value={user?.user_id} copyable />
            <ReadOnlyRow label="Profile ID" value={profile?.id} copyable />
            <ReadOnlyRow label="Account created" value={createdAt} />
            <Field label="Onboarding">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900">
                {profile?.onboarding_complete ? 'Complete' : 'Incomplete'}
              </div>
            </Field>
          </div>
        </div>
      </section>

      {/* Editable profile */}
      <section className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <Mail size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Display</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Display name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white text-zinc-900 rounded-lg px-4 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </Field>
            <Field label="Organization">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Company or team"
                className="w-full bg-white text-zinc-900 rounded-lg px-4 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2 transition-all"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* Security / account actions */}
      <section className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-white pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Security</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <div>
                <div className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                  <KeyRound size={14} className="text-zinc-500" /> Reset password
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">Send a password-reset link to {email || 'your email'}</div>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={sendingReset || !email}
                className="bg-white hover:bg-zinc-50 disabled:opacity-60 text-zinc-900 text-sm font-semibold rounded-lg px-4 py-2 border border-zinc-200 hover:border-amber-500/50 transition-all"
              >
                {sendingReset ? 'Sending…' : 'Send reset email'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <div>
                <div className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                  <LogOut size={14} className="text-zinc-500" /> Sign out
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">End the current session on this device</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="bg-white hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg px-4 py-2 border border-red-200 hover:border-red-400 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
