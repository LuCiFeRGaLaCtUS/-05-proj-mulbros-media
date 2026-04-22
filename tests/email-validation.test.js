import { describe, it, expect } from 'vitest';

// Mirrors validators in server.js — unit-test the pure regex & CRLF logic.
// When server.js refactors extract these, import from there instead.

const EMAIL_RE = /^[^\s@<>"',;:\\]+@[^\s@<>"',;:\\]+\.[^\s@<>"',;:\\]+$/;
const hasCRLF  = (s) => typeof s === 'string' && /[\r\n]/.test(s);

describe('email validation', () => {
  it('accepts typical addresses', () => {
    ['a@b.co', 'first.last+tag@sub.example.com', 'u_1@ex-ample.io'].forEach(addr => {
      expect(EMAIL_RE.test(addr)).toBe(true);
    });
  });

  it('rejects malformed and header-injecting inputs', () => {
    [
      'no-at-sign', 'no@domain', '@nouser.com', '', '   ', 'a@b', 'a b@c.com',
      'x@y.com\nBcc: attacker@evil.com',
      'x@y.com\r\nBcc: attacker@evil.com',
      'foo<bar@baz.com',
    ].forEach(bad => {
      expect(EMAIL_RE.test(bad) && !hasCRLF(bad)).toBe(false);
    });
  });

  it('hasCRLF detects injection attempts', () => {
    expect(hasCRLF('Subject\r\nBcc: evil')).toBe(true);
    expect(hasCRLF('Normal subject')).toBe(false);
  });
});
