import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StytchProvider } from '@stytch/react'
import { stytch } from './lib/stytch'
import { initSentry } from './lib/sentry'
import { STORAGE_KEYS } from './constants'
import App from './App'
import './index.css'

// Initialize Sentry before React renders so even render errors are captured.
// Safe no-op when VITE_SENTRY_DSN is not set (mock mode).
initSentry();

// Default to Simara theme (Sprint 6+ chat-first shell). User-toggleable to "noir"
// via Settings -> Appearance in Phase C. localStorage override wins.
// Read theme. Legacy key 'mulbros_theme' migrated to STORAGE_KEYS.THEME if present.
let savedTheme = null;
if (typeof localStorage !== 'undefined') {
  savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (!savedTheme) {
    const legacy = localStorage.getItem('mulbros_theme');
    if (legacy) {
      localStorage.setItem(STORAGE_KEYS.theme, legacy);
      localStorage.removeItem('mulbros_theme');
      savedTheme = legacy;
    }
  }
}
savedTheme = savedTheme || 'simara';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StytchProvider stytch={stytch}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </StytchProvider>
  </React.StrictMode>,
)
