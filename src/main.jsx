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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StytchProvider stytch={stytch}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </StytchProvider>
  </React.StrictMode>,
)
