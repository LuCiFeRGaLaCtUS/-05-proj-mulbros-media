/**
 * Persona state — localStorage-backed name/image/state for the MO chat persona.
 * Adapted from FSZT (Remix)/src/avatar-state.jsx.
 *
 * State values: 'idle' | 'thinking' | 'speaking'
 * Cross-tab sync via storage events + window CustomEvent dispatch.
 */
import { useEffect, useState, useCallback } from 'react';

const KEY = 'mulbros.persona';
const EVT = 'mulbros:persona-changed';

const DEFAULT = {
  name:  'MO',
  image: null,        // optional dataURL/URL — falls back to SVG mark
  state: 'idle',      // idle | thinking | speaking
};

const read = () => {
  if (typeof localStorage === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

const write = (next) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
  } catch {
    // localStorage full / disabled — silent fail; in-memory state still updates
  }
};

export const usePersona = () => {
  const [persona, setPersona] = useState(read);

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail) setPersona(e.detail);
      else setPersona(read());
    };
    const onStorage = (e) => { if (e.key === KEY) setPersona(read()); };
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const update = useCallback((patch) => {
    setPersona(prev => {
      const next = { ...prev, ...patch };
      write(next);
      return next;
    });
  }, []);

  const setState = useCallback((state) => update({ state }), [update]);

  return { persona, update, setState };
};
