import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Download from './pages/Download'
import Models from './pages/Models'
import Docs from './pages/Docs'
import Chat from './pages/Chat'
import Pricing from './pages/Pricing'
import Auth from './pages/Auth'

export default function App() {
  const location = useLocation()
  const isChat = location.pathname === '/chat'

  if (isChat) {
    return <Chat />
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-ink dark:text-paper">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<Download />} />
          <Route path="/models" element={<Models />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/registar" element={<Navigate to="/register" replace />} />
          <Route path="/login" element={<Auth mode="login" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
