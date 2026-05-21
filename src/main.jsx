import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StytchProvider } from '@stytch/react'
import { stytch } from './lib/stytch'
import { initSentry } from './lib/sentry'
import App from './App'
import './index.css'

// Initialize Sentry before React renders so even render errors are captured.
// Safe no-op when VITE_SENTRY_DSN is not set (mock mode).
initSentry();

// Default to Simara theme (Sprint 6+ chat-first shell). User-toggleable to "noir"
// via Settings -> Appearance in Phase C. localStorage override wins.
const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('mulbros.theme')) || 'simara';
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
