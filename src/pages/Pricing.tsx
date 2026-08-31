import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const freeItems = [
  'Basic model management',
  'Run models locally',
  'Basic merging (TIES, SLERP)',
  'Import from Ollama',
  'Community support',
]

const premiumItems = [
  'Everything in Free',
  'Advanced merging (Procrustes, Fisher, SVD)',
  'Full training system',
  'Cloud sync & backup',
  'Priority support',
  'Performance analytics',
]

const sourceItems = [
  'Complete source code',
  'Full architecture',
  'Commercial rights',
  'Resell rights',
  'Custom modifications',
  'Dedicated support',
]

function TickList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-5 text-white/70">
          <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-[#FF7A00]/15 flex items-center justify-center">
            <Check className="w-3 h-3 text-[#FF7A00]" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  return (
    <div className="bg-[#0A0A0B]">
      <div className="max-w-site mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none mb-4">
            Simple, honest pricing.
          </h1>
          <p className="text-[15px] leading-6 text-white/50">
            Start free. Upgrade when you need power features. Own the source when you are ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur p-7 flex flex-col">
            <p className="text-sm font-semibold text-white mb-1">Free</p>
            <p className="text-4xl font-extrabold tracking-tight text-white mb-6">Free</p>
            <div className="flex-1">
              <TickList items={freeItems} />
            </div>
            <Link to="/download" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition">
              Install Now
            </Link>
          </div>

          <div className="relative rounded-2xl border border-[#FF7A00]/40 bg-gradient-to-b from-[#FF7A00]/[0.06] to-white/[0.03] backdrop-blur p-7 flex flex-col shadow-[0_16px_48px_rgba(255,122,0,0.18),0_0_0_1px_rgba(255,122,0,0.15)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FF7A00] text-[10px] font-extrabold tracking-widest uppercase text-black shadow-md">
              Most Popular
            </span>
            <p className="text-sm font-semibold text-white mb-1">Premium</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold tracking-tight text-white">$10</span>
              <span className="text-sm text-white/40">Lifetime</span>
            </div>
            <div className="flex-1">
              <TickList items={premiumItems} />
            </div>
            <a href="mailto:hello@inferforge.dev" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition shadow-[0_8px_20px_rgba(255,122,0,0.35)]">
              Upgrade to Premium
            </a>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur p-7 flex flex-col">
            <p className="text-sm font-semibold text-white mb-1">Source Code</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold tracking-tight text-white">$2k-6k</span>
              <span className="text-sm text-white/40">One-time</span>
            </div>
            <div className="flex-1">
              <TickList items={sourceItems} />
            </div>
            <a href="mailto:hello@inferforge.dev" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition">
              Contact Site Owner
            </a>
            <div className="mt-4 text-center text-[12px] leading-5">
              <p className="text-white/60 font-medium">We&apos;ll talk.</p>
              <p className="text-white/35">
                add{' '}
                <button
                  onClick={async () => { await navigator.clipboard.writeText('jahmiseryx'); const el = document.getElementById('copy-jahmiseryx'); if (el) { el.textContent = 'copied!'; setTimeout(() => (el.textContent = 'jahmiseryx'), 1200) } }}
                  className="text-[#FF7A00] hover:text-[#ff8c1a] font-semibold underline underline-offset-4 decoration-[#FF7A00]/40"
                >
                  <span id="copy-jahmiseryx">jahmiseryx</span>
                </button>{' '}
                on discord.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/25 mt-10">
          Questions? <a href="mailto:hello@inferforge.dev" className="text-white/50 hover:text-white underline underline-offset-4">hello@inferforge.dev</a> · <Link to="/docs" className="text-white/50 hover:text-white underline underline-offset-4">Read the docs</Link>
        </p>
      </div>
    </div>
  )
}
