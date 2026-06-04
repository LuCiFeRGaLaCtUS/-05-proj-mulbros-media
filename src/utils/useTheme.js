import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

/**
 * Reads the current theme and re-renders whenever TopBar calls applyTheme().
 * TopBar dispatches a 'mulbros-theme' CustomEvent on every toggle.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEYS.theme) || 'dark'
  );

  useEffect(() => {
    const handler = (e) => setTheme(e.detail);
    window.addEventListener('mulbros-theme', handler);
    return () => window.removeEventListener('mulbros-theme', handler);
  }, []);

  return theme;
};
