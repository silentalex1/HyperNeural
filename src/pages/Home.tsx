import { useEffect, useState } from 'react'

function getTarget() {
  const s = localStorage.getItem('inferforge-revamp-target')
  if (s) return Number(s)
  const t = Date.now() + 3 * 24 * 60 * 60 * 1000
  localStorage.setItem('inferforge-revamp-target', String(t))
  return t
}
function pad(n: number) { return String(n).padStart(2,'0') }

export default function Home() {
  const [target] = useState(() => getTarget())
  const [now, setNow] = useState(() => Date.now())
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])
  const d = Math.max(0, target - now)
  const days = Math.floor(d / (24*60*60*1000))
  const hours = Math.floor(d % (24*60*60*1000) / (60*60*1000))
  const mins = Math.floor(d % (60*60*1000) / (60*1000))
  const secs = Math.floor(d % (60*1000) / 1000)
  const Cell = ({v,l}:{v:string,l:string}) => (
    <div className="rounded-2xl border border-blue-800/50 bg-blue-950/40 backdrop-blur px-7 py-6 min-w-[102px] text-center shadow-lg">
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-white tabular-nums">{v}</div>
      <div className="text-[11px] tracking-widest uppercase text-blue-300/60 mt-1">{l}</div>
    </div>
  )
  return (
    <div className="min-h-[calc(100vh-64px)] bg-blue-950 text-slate-100 relative overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right, rgba(249,115,22,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(249,115,22,0.07) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px', maskImage: `radial-gradient(circle 380px at ${mouse.x}px ${mouse.y}px, black 25%, transparent 75%)`, WebkitMaskImage: `radial-gradient(circle 380px at ${mouse.x}px ${mouse.y}px, black 25%, transparent 75%)` }} />
      <div className="relative w-full max-w-3xl text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300 text-xs mb-6">Revamp in progress</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">Sorry we are revamping this website and project.</h1>
        <p className="text-blue-200/60 mt-4">Stay tuned, the countdown timer may not be right.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Cell v={pad(days)} l="Days" />
          <Cell v={pad(hours)} l="Hours" />
          <Cell v={pad(mins)} l="Minutes" />
          <Cell v={pad(secs)} l="Seconds" />
        </div>
        <p className="text-xs text-blue-300/30 mt-8">3 day countdown · InferForge will be back shortly</p>
      </div>
    </div>
  )
}
