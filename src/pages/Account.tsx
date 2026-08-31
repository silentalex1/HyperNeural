import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react'

const CONNECT_API = 'https://inferforge-email.asdwwas233.workers.dev'

export default function Account() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const verifyUsername = (params.get('verify') || '').trim()

  const [step, setStep] = useState<'checking' | 'need-account' | 'code' | 'confirmed' | 'error'>(verifyUsername ? 'checking' : 'need-account')
  const [message, setMessage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [username] = useState(verifyUsername)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!verifyUsername) {
      setStep('need-account')
      return
    }
    const users = (() => {
      try { return JSON.parse(localStorage.getItem('inferforge-users') || '[]') } catch { return [] }
    })()
    const found = users.find((u: any) => u.username.toLowerCase() === verifyUsername.toLowerCase())
    if (found) {
      setEmail(found.email)
      setStep('code')
    } else {
      setStep('need-account')
      setMessage(`No account found for "${verifyUsername}". Create an account first, then run forge connect again.`)
    }
  }, [verifyUsername])

  useEffect(() => {
    if (step !== 'confirmed') return
    const iv = setInterval(() => {
      setCountdown(v => {
        if (v <= 1) {
          clearInterval(iv)
          navigate('/')
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [step, navigate])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code.trim() || code.trim().length !== 5) {
      setError('Paste in the 5-digit code shown in your terminal.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${CONNECT_API}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code: code.trim().toUpperCase(), email, confirm: true }),
      })
      if (!res.ok) throw new Error()
      setStep('confirmed')
    } catch {
      setError('Could not confirm the code. Check the code in your terminal and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#0A0A0B] px-6 py-12">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xs font-extrabold tracking-tighter text-black">IF</span>
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">InferForge</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Connect account</h1>
          <p className="mt-2 text-sm text-white/45">
            {step === 'confirmed' ? 'Your terminal is now connected.' : 'Paste in the code from your terminal to connect.'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6 sm:p-7 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
          {step === 'checking' && (
            <div className="flex items-center justify-center gap-3 py-8 text-white/60 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking account...
            </div>
          )}

          {step === 'need-account' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-200">No verified email account detected</p>
                  <p className="text-xs text-amber-200/70 mt-1 leading-5">{message || 'Verification only works if an email account was created on this site.'}</p>
                </div>
              </div>
              <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition">
                Create account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {step === 'code' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-white/50">Connecting account</p>
                <p className="text-sm font-semibold text-white">{username} · {email}</p>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-white/60">Enter code here</span>
                <div className="mt-1.5 relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                    placeholder="Enter code here"
                    maxLength={5}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#FF7A00]/50 focus:bg-white/[0.08] transition text-center tracking-[0.4em] font-mono"
                  />
                </div>
              </label>
              {error && <p className="text-xs leading-5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">{error}</p>}
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition shadow-[0_8px_20px_rgba(255,122,0,0.3)] disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Connect
              </button>
            </form>
          )}

          {step === 'confirmed' && (
            <div className="space-y-5 text-center py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400">Welcome {username}!</p>
                <p className="text-sm text-white/50 mt-1">
                  Your account is now connected.
                </p>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/35">
          Terminal command: <span className="font-mono text-white/60">forge connect</span>
        </p>
      </div>
    </div>
  )
}