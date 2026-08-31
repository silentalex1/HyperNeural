import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Moon, Sun, Github, MessageSquare, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ExternalConfirm from './ExternalConfirm'

const links = [
  { path: '/#features', label: 'Features', hash: 'features' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/#comparison', label: 'Compare', hash: 'comparison' },
  { path: '/docs', label: 'Documentation' },
]

export default function Navbar() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [confirmHref, setConfirmHref] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  const handleExternal = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setConfirmHref(href)
  }

  const chatHref = 'https://hyperneural.cfd/Inferforge#chat'
  const githubHref = 'https://github.com/silentalex1/HyperNeural'

  return (
    <>
      <nav
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0B]/85 border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-[#0A0A0B]/60 border-white/[0.05]'
        }`}
      >
        <div className="max-w-site mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="text-[11px] font-extrabold tracking-tighter text-black">IF</span>
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">InferForge</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-400/15 text-amber-300 border border-amber-400/20">
                v0.2.0-beta.1
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition ${
                    location.pathname === link.path
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={githubHref}
                onClick={e => handleExternal(e, githubHref)}
                className="ml-1 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user ? (
                <>
                  <a
                    href={chatHref}
                    onClick={e => handleExternal(e, chatHref)}
                    className="ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF7A00] text-white text-[13px] font-semibold hover:bg-[#ff8c1a] transition shadow-[0_4px_16px_rgba(255,122,0,0.25)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat with InferForge
                  </a>
                  <button
                    onClick={() => { logout(); window.location.reload() }}
                    className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 text-[13px] font-medium hover:bg-white/[0.09] hover:text-white transition"
                    title={`Logout ${user.username}`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="ml-3 inline-flex items-center px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition"
                >
                  Create account
                </Link>
              )}
            </div>

            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="lg:hidden p-2 rounded-lg text-white/70"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-white/[0.06] bg-[#0A0A0B] px-6 py-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06]"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <a
                  href={chatHref}
                  onClick={e => { handleExternal(e, chatHref); setOpen(false) }}
                  className="block mt-3 px-4 py-3 rounded-xl bg-[#FF7A00] text-center text-sm font-semibold text-white"
                >
                  Chat with InferForge
                </a>
                <button
                  onClick={() => { logout(); setOpen(false); window.location.reload() }}
                  className="block mt-2 w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-center text-sm font-medium text-white/70"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="block mt-3 px-4 py-3 rounded-xl bg-white text-center text-sm font-semibold text-black"
              >
                Create account
              </Link>
            )}
          </div>
        )}
      </nav>
      <ExternalConfirm
        open={!!confirmHref}
        href={confirmHref || ''}
        onClose={() => setConfirmHref(null)}
        onConfirm={() => {
          if (confirmHref) window.open(confirmHref, '_blank', 'noopener,noreferrer')
          setConfirmHref(null)
        }}
      />
    </>
  )
}
