import { useEffect, useState } from 'react'

function getTarget() {
  const stored = localStorage.getItem('inferforge-revamp-target')
  if (stored) return Number(stored)
  const t = Date.now() + 3 * 24 * 60 * 60 * 1000
  localStorage.setItem('inferforge-revamp-target', String(t))
  return t
}

function pad(n: number) { return String(n).padStart(2,'0') }

export default function Home() {
  const [target] = useState(() => getTarget())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target - now)
  const d = Math.floor(diff / (24*60*60*1000))
  const h = Math.floor(diff % (24*60*60*1000) / (60*60*1000))
  const m = Math.floor(diff % (60*60*1000) / (60*1000))
  const s = Math.floor(diff % (60*1000) / 1000)
  const Cell = ({v,l}:{v:string,l:string}) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-5 min-w-[92px] text-center">
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-white tabular-nums">{v}</div>
      <div className="text-[11px] tracking-widest uppercase text-white/40 mt-1">{l}</div>
    </div>
  )
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0A0B] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/60 mb-6">Revamp in progress</div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Sorry we are revamping this website and project.</h1>
        <p className="text-white/50 mt-4">Stay tuned, the countdown timer may not be right.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Cell v={pad(d)} l="Days" />
          <Cell v={pad(h)} l="Hours" />
          <Cell v={pad(m)} l="Minutes" />
          <Cell v={pad(s)} l="Seconds" />
        </div>
        <p className="text-xs text-white/25 mt-8">3 day countdown · InferForge will be back shortly</p>
      </div>
    </div>
  )
}
