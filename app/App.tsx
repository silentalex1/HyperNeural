import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Models from './pages/Models'
import Download from './pages/Download'
import Chat from './pages/Chat'
import Training from './pages/Training'
import Monitoring from './pages/Monitoring'
import { ThemeProvider } from './context/ThemeContext'
import { ModelProvider } from './context/ModelContext'
import { ToastProvider } from './components/Toast'

export default function App() {
  return (
    <ThemeProvider>
      <ModelProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
              <Nav />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/models" element={<Models />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/download" element={<Download />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ToastProvider>
      </ModelProvider>
    </ThemeProvider>
  )
}
