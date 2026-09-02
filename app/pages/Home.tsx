import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useModels } from '../context/ModelContext'
import Terminal from '../components/Terminal'

const installOptions = [
  {
    id: 'windows',
    label: 'Windows',
    cmd: 'powershell -c "irm https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.ps1 | iex"',
  },
  {
    id: 'unix',
    label: 'macOS / Linux',
    cmd: 'curl -fsSL https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.sh | bash',
  },
  {
    id: 'pip',
    label: 'pip',
    cmd: 'pip install git+https://github.com/silentalex1/HyperNeural.git',
  },
]

const features = [
  {
    title: 'Fast Local Inference',
    description: 'Hardware-accelerated inference with mixed precision support. Your models run on your machine, no cloud required.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    title: 'Agent-Native Chat',
    description: 'The built-in beta model can create, edit, and delete files, run commands, and make web requests safely.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    title: 'Train Your Own',
    description: 'Fine-tune on your own datasets or describe a model in Nexara and let the adaptive trainer handle the rest.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    ),
  },
  {
    title: 'OpenAI-Compatible API',
    description: 'One command starts a local server on port 11435 that speaks the OpenAI chat completions protocol.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    ),
  },
  {
    title: 'Benchmarking Suite',
    description: 'Compare tokens per second, latency, and memory across models and backends before you commit.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    title: 'Deploy to the Browser',
    description: 'Ship AI-powered websites where models load from CDN in chunks. Tiny repos, no servers, deploy anywhere.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    ),
  },
]

const quickstart = [
  { step: '1', title: 'Import your models', cmd: 'forge import ollama', desc: 'Bring every Ollama model you already have into Forge.' },
  { step: '2', title: 'Train the beta model', cmd: 'forge train', desc: 'Build InferForge beta from an Ollama base with a coding curriculum.' },
  { step: '3', title: 'Start building', cmd: 'forge chat', desc: 'Chat with an agent that can read and write files on your machine.' },
]

export default function Home() {
  const { models } = useModels()
  const [activeInstall, setActiveInstall] = useState('windows')
  const [copied, setCopied] = useState(false)

  const current = installOptions.find(o => o.id === activeInstall) ?? installOptions[0]

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(current.cmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-[0.035] pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-accent/[0.13] blur-[130px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-gray-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              v0.2.0 beta is live
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Local LLMs,
              <br />
              <span className="bg-gradient-to-r from-accent via-[#8daaff] to-accent bg-clip-text text-transparent">forged by you.</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-10">
              InferForge is a local model runtime with its own coding agent.
              Pull models, fine-tune them, and ship AI apps — all from one CLI.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Link
                to="/download"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accentHover font-semibold text-sm transition-colors shadow-[0_0_28px_rgba(79,124,255,0.3)]"
              >
                Download InferForge
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/doc"
                className="px-6 py-3 rounded-xl border border-white/[0.1] hover:border-white/25 hover:bg-white/[0.03] font-semibold text-sm transition-all"
              >
                Read the docs
              </Link>
            </div>

            <p className="text-xs text-gray-600">{models.length > 0 ? `${models.length} models connected` : 'Works with your existing Ollama models'}</p>
          </div>

          <div className="max-w-3xl mx-auto mt-16">
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/[0.06] shadow-[0_24px_70px_-30px_rgba(79,124,255,0.35)] bg-black/50 backdrop-blur">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.02]">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-gray-500 font-mono">forge — local</span>
              </div>
              <div className="p-6 min-h-[260px] font-mono text-sm flex flex-col">
                <Terminal />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-white/[0.04] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Up and running in one line</h2>
            <p className="text-gray-500">Pick your platform. The installer handles Python, dependencies, and the forge command.</p>
          </div>

          <div className="max-w-4xl">
            <div className="flex gap-2 mb-4">
              {installOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setActiveInstall(opt.id); setCopied(false) }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeInstall === opt.id
                      ? 'bg-accent text-white shadow-[0_0_18px_rgba(79,124,255,0.25)]'
                      : 'text-gray-400 border border-white/[0.07] hover:text-white hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl pl-5 pr-3 py-3">
              <code className="font-mono text-xs sm:text-sm text-gray-300 overflow-x-auto whitespace-nowrap selection:bg-accent">
                <span className="text-accent mr-3">$</span>
                {current.cmd}
              </code>
              <button
                onClick={copyCmd}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything a local stack needs</h2>
            <p className="text-gray-500">One tool for pulling, running, training, benchmarking, and deploying models.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] hover:border-accent/25 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent mb-5 group-hover:shadow-[0_0_20px_rgba(79,124,255,0.2)] transition-shadow">
                  <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Three steps to your first chat</h2>
            <p className="text-gray-500">No accounts, no API keys, no telemetry. Just you and your hardware.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {quickstart.map(q => (
              <div key={q.step} className="relative p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                <span className="absolute top-6 right-6 font-mono text-4xl font-bold text-white/[0.05] select-none">{q.step}</span>
                <h3 className="font-semibold text-white mb-2 tracking-tight pr-10">{q.title}</h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{q.desc}</p>
                <code className="block font-mono text-xs text-orangeAccent bg-black/40 border border-white/[0.05] rounded-lg px-4 py-3">
                  <span className="text-gray-600 mr-2">$</span>{q.cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] rounded-full bg-accent/[0.09] blur-[110px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready when you are.</h2>
          <p className="text-gray-500 mb-8">Free to use, runs entirely on your machine.</p>
          <Link
            to="/download"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent hover:bg-accentHover font-semibold text-sm transition-colors shadow-[0_0_28px_rgba(79,124,255,0.3)]"
          >
            Install InferForge
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
