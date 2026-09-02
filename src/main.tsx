import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    const msg = String(e.message || '')
    if (msg.includes('startTime') || msg.includes('bare-mux') || msg.includes('MessagePort')) {
      e.preventDefault()
    }
  })
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e.reason as any)?.message || e.reason || '')
    if (msg.includes('bare-mux') || msg.includes('MessagePort') || msg.includes('startTime')) {
      e.preventDefault()
    }
  })
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) {
        if (r.active?.scriptURL.includes('uv') || r.active?.scriptURL.includes('bare-mux') || r.scope.includes('uv')) {
          r.unregister().catch(() => {})
        }
      }
    }).catch(() => {})
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
