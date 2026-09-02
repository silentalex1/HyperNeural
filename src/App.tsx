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
import Account from './pages/Account'
import UserDashboard from './pages/UserDashboard'
import OurModels from './pages/OurModels'
import Batnight from './pages/Batnight'

export default function App() {
  const location = useLocation()
  const isChat = location.pathname === '/chat' || location.pathname === '/chatui' || location.pathname === '/v1/chatui'

  if (isChat) {
    return <Chat />
  }

  const isHome = location.pathname === '/'
  return (
    <div className="min-h-screen flex flex-col bg-[#0e1b3d] text-white antialiased">
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
          <Route path="/account" element={<Account />} />
          <Route path="/dashboard/:username" element={<UserDashboard />} />
          <Route path="/our-models" element={<OurModels />} />
          <Route path="/batnight" element={<Batnight />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chatui" element={<Chat />} />
          <Route path="/v1/chatui" element={<Chat />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
    </div>
  )
}
