import { Link } from 'react-router-dom'
import {
  ArrowRight, Copy, Check, Star, Layers, GitMerge, GraduationCap, Zap,
  Code2, Globe, Shield, FlaskConical, Boxes, Cpu
} from 'lucide-react'
import { useState } from 'react'

const installers = [
  {
    id: 'windows',
    label: 'Windows',
    cmd: 'powershell -c "irm https://hyperneural.cfd/install.ps1 | iex"',
  },
  {
    id: 'macos',
    label: 'macOS',
    cmd: 'curl -fsSL https://hyperneural.cfd/install.sh | bash',
  },
  {
    id: 'linux',
    label: 'Linux',
    cmd: 'curl -fsSL https://hyperneural.cfd/install.sh | bash',
  },
]

const features = [
  {
    icon: Layers,
    title: 'Model Management',
    body: 'Pull, list, import, and version models across GGUF, safetensors, and PyTorch.',
  },
  {
    icon: GitMerge,
    title: 'Model Merging',
    body: 'TIES, SLERP, Procrustes, and Fisher merges that write real usable weights.',
    star: true,
  },
  {
    icon: GraduationCap,
    title: 'Training System',
    body: 'Fine-tune locally with LoRA, curriculums, and the Nexara training DSL.',
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    body: 'Quantization, caching, preloading, and hardware-aware inference routing.',
  },
  {
    icon: Code2,
    title: 'Nexara Language',
    body: 'An AI-native language that compiles into training configs and run scripts.',
  },
  {
    icon: Globe,
    title: 'Web Interface',
    body: 'Local chat UI, model selector, and an OpenAI-compatible API on one command.',
  },
]

const shots = [
  { title: 'forge --help', caption: '44 commands in one CLI', lines: ['$ forge --help', 'INFERFORGE v0.2.0 — faster local LLMs', 'forge merge   Merge models with TIES / SLERP', 'forge train   Fine-tune with Nexara', 'forge run     Chat with a local model'] },
  { title: 'forge list', caption: 'Local execution', lines: ['$ forge list', 'inferforge-beta   huggingface   14.8B', 'qwen2.5-coder:7b  ollama        7B', 'fused-coder       merged        TIES'] },
  { title: 'forge merge', caption: 'Real model merging', lines: ['$ forge merge llama3.1:8b qwen2.5-coder:7b --name fused-coder', 'OK 2 models ready', 'Merging weights with TIES…', 'OK fused-coder is registered'] },
  { title: 'forge run', caption: 'Local execution', lines: ['$ forge run fused-coder', 'InferForge · fused-coder', '> write a rust http server', 'use axum::Router;'] },
]

const compare = [
  { feature: 'Local inference', inferforge: true, ollama: true, lmstudio: true },
  { feature: 'Model merging (TIES / SLERP)', inferforge: true, ollama: false, lmstudio: false },
  { feature: 'Training / fine-tune', inferforge: true, ollama: false, lmstudio: false },
  { feature: 'Custom language (Nexara)', inferforge: true, ollama: false, lmstudio: false },
  { feature: 'OpenAI-compatible API', inferforge: true, ollama: true, lmstudio: true },
  { feature: 'Performance optimizer', inferforge: true, ollama: false, lmstudio: true },
  { feature: 'Web chat interface', inferforge: true, ollama: false, lmstudio: true },
  { feature: 'Runs fully offline', inferforge: true, ollama: true, lmstudio: true },
]

const useCases = [
  { title: 'Privacy-focused AI development', body: 'Keep prompts, weights, and datasets on your machine. Nothing leaves the box.' },
  { title: 'Model research and experimentation', body: 'Merge checkpoints, A/B backends, and measure tokens/sec before you commit.' },
  { title: 'Custom model creation', body: 'Describe a model in Nexara, train it, and ship a local assistant that knows your stack.' },
  { title: 'Local AI applications', body: 'Serve an OpenAI-compatible API for apps that must not call the cloud.' },
]

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
      aria-label="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function Home() {
  const [platform, setPlatform] = useState('windows')
  const current = installers.find(i => i.id === platform) ?? installers[0]

  return (
    <div className="animated-bg">
      <section className="relative overflow-hidden section">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-40 pointer-events-none" />
        <div className="container-site relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6">
              v0.2.0 · Beta · Local-first
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
              InferForge. The Complete Local AI Toolkit
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-3">
              Run, merge, train, and optimize AI models on your own hardware.
            </p>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
              Like Ollama on steroids, with model merging, training and optimization built in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/download" className="btn-primary inline-flex items-center justify-center gap-2">
                Install Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary inline-flex items-center justify-center">
                View Features
              </a>
            </div>
            <div className="mt-12 text-left rounded-2xl border border-line bg-black/70 overflow-hidden shadow-glow max-w-2xl mx-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-line">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[11px] font-mono text-gray-500">forge</span>
                <CopyBtn text="forge pull qwen2.5-coder:7b\nforge merge llama3.1:8b qwen2.5-coder:7b --name fused\nforge run fused" />
              </div>
              <pre className="px-5 py-4 font-mono text-sm text-primary leading-7">
{`$ forge pull qwen2.5-coder:7b
$ forge merge llama3.1:8b qwen2.5-coder:7b --name fused
$ forge run fused`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container-site">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">Everything in one toolkit</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Think of it as Ollama on steroids. Run models locally, then merge, train and optimize them.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(item => (
              <div key={item.title} className="card group relative">
                {item.star && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
                    <Star className="w-3 h-3 fill-primary" /> Main
                  </span>
                )}
                <div className="p-3 rounded-xl w-fit mb-4 bg-gradient-to-br from-primary to-accent text-ink">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-10 grid sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <li>44+ commands for a complete AI workflow</li>
            <li>Advanced model merging (TIES, SLERP, Procrustes, Fisher)</li>
            <li>AI-native programming language (Nexara)</li>
            <li>Performance optimization for faster inference</li>
            <li>Everything runs locally. Your data stays private</li>
          </ul>
        </div>
      </section>

      <section id="screenshots" className="section border-t border-gray-200 dark:border-line">
        <div className="container-site">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">The CLI, in color</h2>
            <p className="text-gray-500 dark:text-gray-400">44 commands · Real model merging · Local execution</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {shots.map(shot => (
              <div key={shot.title} className="rounded-2xl border border-line bg-black/80 overflow-hidden">
                <div className="px-4 py-2 border-b border-line flex items-center justify-between">
                  <span className="font-mono text-xs text-primary">{shot.title}</span>
                  <span className="text-[11px] text-gray-500">{shot.caption}</span>
                </div>
                <pre className="px-4 py-4 font-mono text-[13px] text-gray-200 leading-6 whitespace-pre-wrap">
                  {shot.lines.join('\n')}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="section">
        <div className="container-site">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">Why Choose InferForge?</h2>
            <p className="text-gray-500 dark:text-gray-400">InferForge vs Ollama vs LM Studio</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Capability</th>
                  <th className="px-4 py-3 font-semibold text-primary">InferForge</th>
                  <th className="px-4 py-3 font-semibold">Ollama</th>
                  <th className="px-4 py-3 font-semibold">LM Studio</th>
                </tr>
              </thead>
              <tbody>
                {compare.map(row => (
                  <tr key={row.feature} className="border-t border-line">
                    <td className="px-4 py-3">{row.feature}</td>
                    <td className="px-4 py-3 text-primary">{row.inferforge ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{row.ollama ? '✓' : '✗'}</td>
                    <td className="px-4 py-3 text-gray-500">{row.lmstudio ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="specs" className="section border-t border-gray-200 dark:border-line">
        <div className="container-site">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              ['44+', 'CLI Commands'],
              ['70+', 'Individual Operations'],
              ['9', 'Major Feature Categories'],
              ['3', 'Model Formats'],
            ].map(([n, l]) => (
              <div key={l} className="card text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{n}</div>
                <div className="text-sm text-gray-500">{l}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Architecture</h3>
            <p className="font-mono text-sm text-gray-500 dark:text-gray-300 leading-7">
              CLI → Registry → Router (native / Ollama / HuggingFace) → Merge · Train · Serve · Web UI
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['GGUF', 'safetensors', 'PyTorch'].map(fmt => (
                <span key={fmt} className="px-3 py-1 rounded-full text-xs border border-primary/30 text-primary">{fmt}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="install" className="section">
        <div className="container-site max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">Install in one line</h2>
            <p className="text-gray-500 dark:text-gray-400">Windows, macOS, and Linux. Python 3.10+.</p>
          </div>
          <div className="flex gap-2 mb-4">
            {installers.map(item => (
              <button
                key={item.id}
                onClick={() => setPlatform(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  platform === item.id
                    ? 'bg-primary text-ink'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-black/70 px-4 py-3 font-mono text-sm text-primary overflow-x-auto">
            <span className="flex-1 whitespace-nowrap">{current.cmd}</span>
            <CopyBtn text={current.cmd} />
          </div>
          <ol className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
            <li className="card"><span className="text-primary font-mono">1.</span> Install InferForge</li>
            <li className="card"><span className="text-primary font-mono">2.</span> forge pull a model</li>
            <li className="card"><span className="text-primary font-mono">3.</span> forge run or forge chat</li>
          </ol>
        </div>
      </section>

      <section id="use-cases" className="section border-t border-gray-200 dark:border-line">
        <div className="container-site">
          <h2 className="text-3xl md:text-5xl font-bold mb-10 text-center">Built for real work</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {useCases.map(item => (
              <div key={item.title} className="card">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.body}</p>
              </div>
            ))}
          </div>
          <blockquote className="card mt-6 text-gray-500 dark:text-gray-300 italic">
            “We needed Ollama’s simplicity with merge and train on the same machine. InferForge is that toolkit.”
          </blockquote>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-24 bg-[#0A0A0B] border-t border-white/[0.06]">
        <div className="max-w-site mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none mb-4">Simple, honest pricing.</h2>
            <p className="text-[15px] leading-6 text-white/50">Start free. Upgrade when you need power features.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 flex flex-col">
              <p className="text-sm font-semibold text-white">Free</p>
              <p className="text-4xl font-extrabold tracking-tight text-white mt-1 mb-6">Free</p>
              <ul className="space-y-3 flex-1 text-[13.5px] text-white/70">
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Basic model management</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Run models locally</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Basic merging (TIES, SLERP)</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Import from Ollama</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Community support</li>
              </ul>
              <Link to="/download" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition">Install Now</Link>
            </div>
            <div className="relative rounded-2xl border border-[#FF7A00]/40 bg-gradient-to-b from-[#FF7A00]/[0.06] to-white/[0.03] p-7 flex flex-col shadow-[0_16px_48px_rgba(255,122,0,0.18)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FF7A00] text-[10px] font-extrabold tracking-widest uppercase text-black">Most Popular</span>
              <p className="text-sm font-semibold text-white">Premium</p>
              <div className="flex items-baseline gap-2 mt-1 mb-6"><span className="text-4xl font-extrabold tracking-tight text-white">$10</span><span className="text-sm text-white/40">Lifetime</span></div>
              <ul className="space-y-3 flex-1 text-[13.5px] text-white/70">
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Everything in Free</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Advanced merging (Procrustes, Fisher, SVD)</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Full training system</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Cloud sync & backup</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Priority support</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Performance analytics</li>
              </ul>
              <a href="mailto:hello@inferforge.dev" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition shadow-[0_8px_20px_rgba(255,122,0,0.35)]">Upgrade to Premium</a>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 flex flex-col">
              <p className="text-sm font-semibold text-white">Source Code</p>
              <div className="flex items-baseline gap-2 mt-1 mb-6"><span className="text-4xl font-extrabold tracking-tight text-white">$2k-6k</span><span className="text-sm text-white/40">One-time</span></div>
              <ul className="space-y-3 flex-1 text-[13.5px] text-white/70">
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Complete source code</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Full architecture</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Commercial rights</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Resell rights</li>
                <li className="flex gap-2.5"><span className="text-[#FF7A00]">✓</span> Dedicated support</li>
              </ul>
              <a href="mailto:hello@inferforge.dev" className="mt-8 inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition">Contact Site Owner</a>
              <div className="mt-4 text-center text-[12px] leading-5">
                <p className="text-white/60 font-medium">We&apos;ll talk.</p>
                <p className="text-white/35">
                  add{' '}
                  <button
                    onClick={async () => { await navigator.clipboard.writeText('jahmiseryx'); const el = document.getElementById('copy-jahmiseryx-home'); if (el) { el.textContent = 'copied!'; setTimeout(() => (el.textContent = 'jahmiseryx'), 1200) } }}
                    className="text-[#FF7A00] hover:text-[#ff8c1a] font-semibold underline underline-offset-4 decoration-[#FF7A00]/40"
                  >
                    <span id="copy-jahmiseryx-home">jahmiseryx</span>
                  </button>{' '}
                  on discord.
                </p>
              </div>
            </div>
          </div>
          <p className="text-center mt-6"><Link to="/pricing" className="text-sm text-white/40 hover:text-white underline underline-offset-4">View full pricing →</Link></p>
        </div>
      </section>

      <section id="docs" className="section border-t border-gray-200 dark:border-line">
        <div className="container-site">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">Documentation</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: '/docs', title: 'Getting Started', icon: Shield },
              { to: '/docs', title: 'Command Reference', icon: Boxes },
              { to: '/docs', title: 'API Documentation', icon: Cpu },
              { to: '/docs', title: 'Troubleshooting', icon: FlaskConical },
            ].map(item => (
              <Link key={item.title} to={item.to} className="card flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
