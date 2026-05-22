import React, { useState, useEffect, useRef } from 'react';
import { useStytch } from '@stytch/react';
import {
  Mail, Lock, Phone, Eye, EyeOff, KeyRound, CheckCircle2, ChevronDown,
  Check, Loader2, ArrowRight, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { BRAND } from '../../lib/brand';

// ════════════════════════════════════════════════════════════════════════════
// AI Operator — Login Screen
// Ported from FSZT Remix v2 auth-screen.jsx layout (split navy + white).
// Backend: Stytch passwords (email tab) + Stytch SMS OTP (phone tab).
// ════════════════════════════════════════════════════════════════════════════

const NAVY        = '#0B1D3A';
const NAVY_DEEP   = '#061328';
const TEAL        = '#0F6E56';
const TEAL_2      = '#5DCAA5';
const TEAL_3      = '#4FB59A';
const TEAL_TINT   = 'rgba(15,110,86,0.08)';
const TEAL_TINT_2 = 'rgba(15,110,86,0.18)';
const CORAL       = '#E24B4A';
const CORAL_TINT  = 'rgba(226,75,74,0.15)';
const LINE        = '#E0E0E0';
const LINE_2      = '#F0F0F0';
const INK         = '#0B1D3A';
const INK_2       = '#3A4A66';
const MUTED       = '#7A7A7E';
const MUTED_2     = '#A3A3A6';
const BG          = '#F5F6F8';
const SURFACE     = '#FFFFFF';

const COUNTRIES = [
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPhone(digits, dial) {
  const d = digits.replace(/\D/g, '').slice(0, 14);
  if (dial === '+1') {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

function isPhoneValid(digits, dial) {
  const len = digits.replace(/\D/g, '').length;
  if (dial === '+1') return len === 10;
  return len >= 7 && len <= 14;
}

const toE164 = (digits, dial) => `${dial}${digits.replace(/\D/g, '')}`;

// ── Brand mark (navy logo card) ──────────────────────────────────────────────
const BrandLogo = ({ size = 36, light = false }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 40 40">
      {light ? (
        <rect x="2" y="2" width="36" height="36" rx="10" fill="#fff" fillOpacity="0.06" stroke="rgba(255,255,255,0.18)" />
      ) : (
        <rect x="2" y="2" width="36" height="36" rx="10" fill={NAVY} />
      )}
      <g transform="translate(20,20)">
        {[0, 1, 2, 3].map(i => {
          const a = (i * 90 - 135) * Math.PI / 180;
          return <circle key={i} cx={Math.cos(a) * 8} cy={Math.sin(a) * 8} r="2" fill={TEAL_3} />;
        })}
        <circle cx="0" cy="0" r="3" fill="#fff" />
        {[0, 1, 2, 3].map(i => {
          const a = (i * 90 - 135) * Math.PI / 180;
          return (
            <line key={i} x1="0" y1="0" x2={Math.cos(a) * 8} y2={Math.sin(a) * 8}
              stroke={TEAL_3} strokeWidth="1" opacity="0.45" />
          );
        })}
      </g>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
      <span style={{
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
        color: light ? '#fff' : NAVY,
        fontFamily: "'Inter Tight', sans-serif",
      }}>
        {BRAND.name}
      </span>
      <span style={{
        fontSize: 10, color: light ? TEAL_3 : TEAL_2, textTransform: 'uppercase',
        letterSpacing: '0.18em', fontWeight: 500, fontFamily: 'DM Mono, monospace',
      }}>
        {BRAND.subtitle}
      </span>
    </div>
  </div>
);

// ── Country picker (used in phone form) ──────────────────────────────────────
const CountryPicker = ({ country, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: '100%', padding: '0 10px 0 14px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: INK, fontSize: 14, fontWeight: 500,
        borderRight: `1px solid ${LINE}`,
      }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{country.flag}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: INK_2, fontFamily: 'DM Mono, monospace' }}>
          {country.dial}
        </span>
        <ChevronDown size={13} color={MUTED_2} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 240, maxHeight: 280, overflowY: 'auto',
          background: '#fff', border: `1px solid ${LINE}`,
          borderRadius: 10, boxShadow: '0 12px 32px rgba(11,29,58,0.12)',
          zIndex: 50, padding: 4,
          animation: 'fade-up 160ms ease-out',
        }}>
          {COUNTRIES.map(c => {
            const sel = c.code === country.code;
            return (
              <button key={c.code} type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', border: 'none',
                  background: sel ? TEAL_TINT_2 : 'transparent',
                  cursor: 'pointer', textAlign: 'left', borderRadius: 6,
                  fontSize: 13, color: INK,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = sel ? TEAL_TINT_2 : LINE_2}
                onMouseLeave={(e) => e.currentTarget.style.background = sel ? TEAL_TINT_2 : 'transparent'}>
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: MUTED, fontFamily: 'DM Mono, monospace' }}>{c.dial}</span>
                {sel && <Check size={13} color={TEAL} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Text input ───────────────────────────────────────────────────────────────
const TextInput = ({ label, value, onChange, placeholder, error, type = 'text', autoComplete, autoFocus, rightSlot, disabled }) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? CORAL : focused ? TEAL : LINE;
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: INK_2, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 48, padding: rightSlot ? '0 44px 0 14px' : '0 14px',
            border: `1.5px solid ${borderColor}`, borderRadius: 10,
            fontSize: 15, color: INK, background: '#fff', outline: 'none',
            transition: 'border-color 160ms ease',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <div style={{
          fontSize: 12, color: CORAL, marginTop: 6,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
};

// ── Phone input (with country picker) ────────────────────────────────────────
const PhoneInput = ({ country, onCountry, value, onChange, error }) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? CORAL : focused ? TEAL : LINE;
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: INK_2, marginBottom: 6 }}>
        Phone number
      </label>
      <div style={{
        display: 'flex', alignItems: 'stretch', height: 48,
        border: `1.5px solid ${borderColor}`, borderRadius: 10,
        background: '#fff', overflow: 'hidden',
        transition: 'border-color 160ms ease',
      }}>
        <CountryPicker country={country} onChange={onCountry} />
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(formatPhone(e.target.value, country.dial))}
          placeholder={country.dial === '+1' ? '(555) 123-4567' : '555 123 4567'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: '0 14px',
            border: 'none', fontSize: 15, color: INK,
            background: 'transparent', outline: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
      </div>
      {error && (
        <div style={{
          fontSize: 12, color: CORAL, marginTop: 6,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
};

// ── 6-digit OTP input ────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, onComplete, error }) => {
  const refs = useRef([]);
  const digits = value.padEnd(6, ' ').split('');

  const setDigit = (i, ch) => {
    const c = ch.replace(/\D/g, '').slice(-1);
    if (!c && ch !== '') return;
    const arr = value.split('');
    while (arr.length < 6) arr.push('');
    arr[i] = c;
    const next = arr.join('').slice(0, 6).trimEnd();
    onChange(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
    if (next.length === 6) onComplete?.(next);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.split('');
      while (arr.length < 6) arr.push('');
      if (arr[i]) {
        arr[i] = '';
        onChange(arr.join('').trimEnd());
      } else if (i > 0) {
        arr[i - 1] = '';
        onChange(arr.join('').trimEnd());
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t) {
      e.preventDefault();
      onChange(t);
      if (t.length === 6) onComplete?.(t);
      else refs.current[t.length]?.focus();
    }
  };

  return (
    <div style={{
      display: 'flex', gap: 10, justifyContent: 'space-between',
    }}>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const filled = !!digits[i].trim();
        return (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i].trim()}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 50, height: 60, textAlign: 'center',
              fontSize: 24, fontWeight: 600, color: NAVY,
              fontFamily: 'DM Mono, monospace',
              border: `1.5px solid ${error ? CORAL : filled ? TEAL : LINE}`,
              borderRadius: 10,
              background: filled ? TEAL_TINT_2 : '#fff',
              outline: 'none',
              transition: 'all 140ms ease',
            }}
          />
        );
      })}
    </div>
  );
};

// ── Primary button ───────────────────────────────────────────────────────────
const PrimaryButton = ({ children, onClick, disabled, loading, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%', height: 48, padding: '0 20px',
      background: disabled ? '#CBD2DD' : TEAL,
      color: '#fff', border: 'none', borderRadius: 10,
      fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: disabled ? 'none' : '0 1px 2px rgba(15,110,86,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
      transition: 'background 160ms ease, transform 120ms ease',
    }}
    onMouseEnter={(e) => {
      if (!disabled && !loading) {
        e.currentTarget.style.background = TEAL_2;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled && !loading) {
        e.currentTarget.style.background = TEAL;
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : children}
  </button>
);

// ── Mode toggle (Email | Phone) ──────────────────────────────────────────────
const ChannelToggle = ({ channel, onChange }) => (
  <div style={{
    display: 'inline-flex', padding: 4,
    background: BG, borderRadius: 10, border: `1px solid ${LINE_2}`,
  }}>
    {[
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Phone' },
    ].map(o => {
      const sel = channel === o.id;
      return (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '7px 16px', fontSize: 13, fontWeight: 600,
          background: sel ? '#fff' : 'transparent',
          color: sel ? NAVY : MUTED,
          border: 'none', borderRadius: 7, cursor: 'pointer',
          boxShadow: sel ? '0 1px 3px rgba(11,29,58,0.08)' : 'none',
          transition: 'all 160ms ease',
        }}>
          {o.label}
        </button>
      );
    })}
  </div>
);

// ── Sub-mode toggle (Sign in | Sign up) ──────────────────────────────────────
const ModeToggle = ({ mode, onChange }) => (
  <div style={{
    display: 'flex', gap: 4, padding: 4, marginBottom: 20,
    background: BG, borderRadius: 10, border: `1px solid ${LINE_2}`,
  }}>
    {['signin', 'signup'].map(m => {
      const sel = mode === m;
      return (
        <button key={m} onClick={() => onChange(m)} style={{
          flex: 1, padding: '7px 12px', fontSize: 13, fontWeight: 600,
          background: sel ? '#fff' : 'transparent',
          color: sel ? NAVY : MUTED,
          border: 'none', borderRadius: 7, cursor: 'pointer',
          boxShadow: sel ? '0 1px 3px rgba(11,29,58,0.08)' : 'none',
          transition: 'all 160ms ease',
        }}>
          {m === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      );
    })}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Email forms — preserved from previous Stytch passwords implementation
// ════════════════════════════════════════════════════════════════════════════

const ForgotPasswordView = ({ onBack }) => {
  const stytch = useStytch();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await stytch.passwords.resetByEmailStart({
        email,
        login_redirect_url:    `${window.location.origin}/reset-password`,
        reset_password_redirect_url: `${window.location.origin}/reset-password`,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ animation: 'fade-up 320ms ease-out' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: TEAL_TINT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          <CheckCircle2 size={22} color={TEAL_2} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: NAVY, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px', lineHeight: 1.5 }}>
          We sent a reset link to <strong style={{ color: INK }}>{email}</strong>.
        </p>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: TEAL, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        }}>
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-up 320ms ease-out' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: NAVY, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        Reset your password
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 20px' }}>
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          autoFocus
        />
        {error && (
          <div style={{ fontSize: 12, color: CORAL, padding: '8px 12px', background: CORAL_TINT, borderRadius: 8 }}>
            {error}
          </div>
        )}
        <PrimaryButton type="submit" loading={loading} disabled={!email}>
          Send reset link <ArrowRight size={16} />
        </PrimaryButton>
        <button type="button" onClick={onBack} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: MUTED, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          textAlign: 'center', marginTop: 4,
        }}>
          ← Back to sign in
        </button>
      </form>
    </div>
  );
};

const EmailForm = ({ mode, onSwitchMode }) => {
  const stytch = useStytch();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [sent,     setSent]     = useState(false);
  const [forgot,   setForgot]   = useState(false);

  if (forgot) return <ForgotPasswordView onBack={() => setForgot(false)} />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await stytch.passwords.authenticate({
          email, password, session_duration_minutes: 10080,
        });
      } else {
        await stytch.passwords.create({
          email, password, session_duration_minutes: 10080,
        });
        setSent(true);
      }
    } catch (err) {
      setError(err.message || (mode === 'signin' ? 'Invalid email or password.' : 'Could not create account.'));
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ animation: 'fade-up 320ms ease-out' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: TEAL_TINT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <Mail size={22} color={TEAL_2} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: NAVY, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          We sent a verification link to <strong style={{ color: INK }}>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-up 320ms ease-out' }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, color: NAVY, margin: '0 0 6px', letterSpacing: '-0.025em' }}>
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>
        {mode === 'signin' ? 'Sign in with your email and password.' : 'Use your email to get started.'}
      </p>

      <ModeToggle mode={mode} onChange={onSwitchMode} />

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          autoFocus
        />
        <TextInput
          label={mode === 'signup' ? 'New password' : 'Password'}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          type={showPw ? 'text' : 'password'}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          rightSlot={
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{
                background: 'none', border: 'none', padding: 6, cursor: 'pointer',
                color: MUTED_2, display: 'inline-flex',
              }}
              tabIndex={-1}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />
        {mode === 'signup' && (
          <TextInput
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
          />
        )}
        {mode === 'signin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
            <button type="button" onClick={() => setForgot(true)} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: TEAL, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            }}>
              Forgot password?
            </button>
          </div>
        )}
        {error && (
          <div style={{
            fontSize: 12, color: CORAL, padding: '8px 12px',
            background: CORAL_TINT, borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}
        <PrimaryButton type="submit" loading={loading} disabled={!email || !password}>
          {mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
        </PrimaryButton>
      </form>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Phone OTP form — Stytch SMS OTP
// ════════════════════════════════════════════════════════════════════════════

const PhoneForm = ({ mode, onSwitchMode }) => {
  const stytch = useStytch();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone,   setPhone]   = useState('');
  const [phoneErr,setPhoneErr] = useState('');
  const [sending, setSending] = useState(false);
  const [step,    setStep]    = useState('phone'); // 'phone' | 'otp'
  const [methodId,setMethodId] = useState(null);
  const [otp,     setOtp]     = useState('');
  const [otpErr,  setOtpErr]  = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendIn,setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async (e) => {
    e?.preventDefault?.();
    setPhoneErr('');
    if (!isPhoneValid(phone, country.dial)) {
      setPhoneErr('Please enter a valid phone number');
      return;
    }
    setSending(true);
    try {
      const e164 = toE164(phone, country.dial);
      const res = await stytch.otps.sms.loginOrCreate({ phone_number: e164 });
      setMethodId(res.method_id);
      setStep('otp');
      setResendIn(30);
      setOtp('');
      setOtpErr('');
    } catch (err) {
      setPhoneErr(err?.error_message || err?.message || 'Could not send code. Try again.');
    }
    setSending(false);
  };

  const verifyOtp = async (code) => {
    if (!methodId) return;
    setVerifying(true);
    setOtpErr('');
    try {
      await stytch.otps.authenticate({
        method_id: methodId,
        code,
        session_duration_minutes: 10080,
      });
      // Stytch session active — App.jsx routes to /
    } catch (err) {
      setOtpErr(err?.error_message || 'Invalid code. Try again.');
      setOtp('');
    }
    setVerifying(false);
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setResendIn(30);
    setOtp('');
    setOtpErr('');
    try {
      const e164 = toE164(phone, country.dial);
      const res = await stytch.otps.sms.loginOrCreate({ phone_number: e164 });
      setMethodId(res.method_id);
    } catch (err) {
      setOtpErr(err?.error_message || 'Could not resend code.');
    }
  };

  if (step === 'otp') {
    return (
      <div style={{ animation: 'fade-up 320ms ease-out' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: TEAL_TINT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <Lock size={20} color={TEAL_2} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: NAVY, margin: '0 0 6px', letterSpacing: '-0.025em' }}>
          Enter verification code
        </h2>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 6px', lineHeight: 1.5 }}>
          We sent a 6-digit code to{' '}
          <span style={{ color: INK, fontWeight: 600 }}>{country.dial} {phone}</span>
        </p>
        <button onClick={() => setStep('phone')} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: TEAL, fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          marginBottom: 22,
        }}>
          ← Change number
        </button>

        <div style={{ marginBottom: 14 }}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            onComplete={verifyOtp}
            error={!!otpErr}
          />
        </div>

        {otpErr && (
          <div style={{ fontSize: 13, color: CORAL, marginBottom: 12, textAlign: 'center' }}>
            {otpErr}
          </div>
        )}

        {verifying && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: MUTED, fontSize: 13, marginBottom: 14,
          }}>
            <Loader2 size={14} className="animate-spin" />
            Verifying…
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 13, color: MUTED, marginTop: 12 }}>
          Didn't get it?{' '}
          {resendIn > 0 ? (
            <span>Resend in <span style={{ color: INK_2, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{resendIn}s</span></span>
          ) : (
            <button onClick={resend} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: TEAL, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}>
              Resend code
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-up 320ms ease-out' }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, color: NAVY, margin: '0 0 6px', letterSpacing: '-0.025em' }}>
        {mode === 'signin' ? 'Welcome back' : 'Sign in with phone'}
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>
        We'll text you a verification code — no password required.
      </p>

      <ModeToggle mode={mode} onChange={onSwitchMode} />

      <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PhoneInput
          country={country}
          onCountry={setCountry}
          value={phone}
          onChange={setPhone}
          error={phoneErr}
        />
        <PrimaryButton
          type="submit"
          loading={sending}
          disabled={!isPhoneValid(phone, country.dial)}
        >
          {sending ? 'Sending code…' : <>Send code <ArrowRight size={16} /></>}
        </PrimaryButton>
      </form>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// LoginPage — split layout
// ════════════════════════════════════════════════════════════════════════════

export const LoginPage = () => {
  const [channel, setChannel] = useState('email');  // 'email' | 'phone'
  const [mode,    setMode]    = useState('signin'); // 'signin' | 'signup'

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', alignItems: 'stretch',
      background: NAVY_DEEP, overflow: 'hidden',
    }}>
      {/* LEFT — brand panel */}
      <div style={{
        flex: '1 1 0', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        padding: '48px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        color: '#fff',
      }} className="hidden lg:flex">
        {/* ambient orbs */}
        <div style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,110,86,0.4), transparent 70%)',
          top: -120, right: -80,
        }} />
        <div style={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,181,154,0.18), transparent 70%)',
          bottom: -80, left: -40,
        }} />
        {/* faint grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 60% 40%, black 30%, transparent 80%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <BrandLogo light />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <div style={{
            fontSize: 11, color: TEAL_3, textTransform: 'uppercase', letterSpacing: '0.16em',
            fontWeight: 500, marginBottom: 18, fontFamily: 'DM Mono, monospace',
          }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: TEAL_3, marginRight: 8, verticalAlign: 'middle',
            }} />
            {BRAND.eyebrow}
          </div>
          <h1 style={{
            fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.025em',
            margin: '0 0 20px', fontWeight: 700,
            fontFamily: "'Inter Tight', sans-serif",
          }}>
            {BRAND.headline}
          </h1>
          <p style={{
            fontSize: 15.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)',
            margin: 0, maxWidth: 420,
          }}>
            {BRAND.description}
          </p>
        </div>

        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', gap: 36,
          color: 'rgba(255,255,255,0.7)', fontSize: 12.5,
        }}>
          {BRAND.stats.map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em',
                fontFamily: 'DM Mono, monospace',
              }}>
                {s.num}
              </div>
              <div style={{ marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div style={{
        flex: '0 0 520px', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative',
      }} className="w-full lg:w-[520px] lg:flex-[0_0_520px]">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{
            marginBottom: 28, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <BrandLogo />
            <ChannelToggle channel={channel} onChange={setChannel} />
          </div>

          {channel === 'email'
            ? <EmailForm mode={mode} onSwitchMode={setMode} />
            : <PhoneForm mode={mode} onSwitchMode={setMode} />}

          <div style={{
            marginTop: 24, padding: '12px 14px',
            borderTop: `1px solid ${LINE_2}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: MUTED, justifyContent: 'center',
          }}>
            <ShieldCheck size={13} color={TEAL_2} />
            {BRAND.trust}
          </div>

          <div style={{
            marginTop: 14, fontSize: 11, color: MUTED_2, textAlign: 'center', lineHeight: 1.5,
          }}>
            By continuing you agree to our{' '}
            <a href="#" style={{ color: MUTED, textDecoration: 'underline' }}>Terms</a>{' '}and{' '}
            <a href="#" style={{ color: MUTED, textDecoration: 'underline' }}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ResetPasswordPage — preserved (App.jsx still routes here)
// ════════════════════════════════════════════════════════════════════════════

export const ResetPasswordPage = () => {
  const stytch = useStytch();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await stytch.passwords.resetByEmail({
        token, password, session_duration_minutes: 10080,
      });
      setDone(true);
      setTimeout(() => { window.history.replaceState({}, '', '/'); }, 1500);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: BG,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff', border: `1px solid ${LINE}`,
        borderRadius: 16, padding: 32,
        boxShadow: '0 1px 3px rgba(11,29,58,0.04)',
      }}>
        <BrandLogo size={36} />
        <h1 style={{
          fontSize: 24, fontWeight: 600, color: NAVY,
          margin: '24px 0 6px', letterSpacing: '-0.02em',
        }}>
          Set new password
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>
          Choose at least 8 characters with letters and numbers.
        </p>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999, background: TEAL_TINT,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
            }}>
              <CheckCircle2 size={26} color={TEAL} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: '0 0 6px' }}>
              Password updated.
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
              Redirecting to your dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextInput
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              rightSlot={
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    background: 'none', border: 'none', padding: 6, cursor: 'pointer',
                    color: MUTED_2, display: 'inline-flex',
                  }}
                  tabIndex={-1}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
            <TextInput
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
            />
            {error && (
              <div style={{
                fontSize: 12, color: CORAL, padding: '8px 12px',
                background: CORAL_TINT, borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <PrimaryButton type="submit" loading={loading} disabled={!password || !confirm}>
              <KeyRound size={15} /> Set new password
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
