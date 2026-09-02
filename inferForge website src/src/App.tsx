import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Download from './pages/Download'
import Models from './pages/Models'
import Docs from './pages/Docs'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<Download />} />
          <Route path="/models" element={<Models />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
