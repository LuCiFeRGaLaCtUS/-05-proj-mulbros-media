import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#27272a',
          color: '#f4f4f5',
          border: '1px solid #3f3f46',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#18181b',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#18181b',
          },
        },
      }}
    />
  </React.StrictMode>,
)