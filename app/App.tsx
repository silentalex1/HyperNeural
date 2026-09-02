import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Models from './pages/Models'
import Download from './pages/Download'
import Docs from './pages/Docs'
import Chat from './pages/Chat'
import Benchmarks from './pages/Benchmarks'
import Monitoring from './pages/Monitoring'
import { ModelProvider } from './context/ModelContext'
import { ToastProvider } from './components/Toast'

export default function App() {
  return (
    <ModelProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#030304] text-white flex flex-col">
          <Nav />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/models" element={<Models />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/BenchMarks" element={<Benchmarks />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/download" element={<Download />} />
              <Route path="/doc" element={<Docs />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </ModelProvider>
  )
}
