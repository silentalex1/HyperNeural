import { useState } from 'react'

const platforms = [
  {
    label: 'Windows',
    note: 'PowerShell',
    cmd: 'powershell -c "irm https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.ps1 | iex"',
  },
  {
    label: 'macOS / Linux',
    note: 'curl',
    cmd: 'curl -fsSL https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.sh | bash',
  },
  {
    label: 'pip',
    note: 'Any platform with Python 3.11+',
    cmd: 'pip install git+https://github.com/silentalex1/HyperNeural.git',
  },
]

const quickstart = [
  { cmd: 'forge --version', desc: 'Verify the installation' },
  { cmd: 'forge import ollama', desc: 'Import models you already have' },
  { cmd: 'forge pull qwen2.5-coder:7b', desc: 'Or download a new one' },
  { cmd: 'forge train', desc: 'Build InferForge beta' },
  { cmd: 'forge chat', desc: 'Talk to your model' },
]

const buildTargets = [
  { name: 'Desktop', desc: 'Embed AI into desktop apps' },
  { name: 'Website', desc: 'OpenAI-compatible API for web apps' },
  { name: 'Discord', desc: 'AI-powered Discord bots' },
  { name: 'Node.js', desc: 'Server-side AI integration' },
  { name: 'Python', desc: 'Scripts and notebooks' },
  { name: 'CLI', desc: 'chat, train, run, serve' },
]

export default function Download() {
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const active = platforms[tab]

  const copyCmd = () => {
    navigator.clipboard.writeText(active.cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-[0.03] pointer-events-none" />

      <main className="max-w-3xl mx-auto w-full px-6 py-16 relative z-10">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Install InferForge</h1>
          <p className="text-gray-500 text-base">
            One command, then <code className="text-orangeAccent font-mono text-sm">forge chat</code>
          </p>
        </div>

        {/* Installer — tabbed, no scrollbars */}
        <section className="mb-16">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-3 pt-3 pb-0 border-b border-white/[0.06] bg-black/30">
              {platforms.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => { setTab(i); setCopied(false) }}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
                    tab === i
                      ? 'text-white border-accent bg-white/[0.04]'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-gray-600 hidden sm:block pr-2">{active.note}</span>
            </div>

            {/* Command */}
            <div className="p-5">
              <div className="group flex items-center gap-3 bg-black/60 border border-white/[0.07] rounded-xl px-4 py-3.5">
                <span className="text-accent font-mono text-sm select-none shrink-0">$</span>
                <code className="font-mono text-[13px] text-gray-200 break-all leading-relaxed selection:bg-accent">
                  {active.cmd}
                </code>
                <button
                  onClick={copyCmd}
                  aria-label="Copy command"
                  className={`ml-auto shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    copied
                      ? 'bg-green-400/10 border-green-400/25 text-green-400'
                      : 'bg-white/[0.06] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-3 px-1">
                The script checks for Python 3.11+ and installs it if missing. Verify with <code className="font-mono text-gray-500">forge --version</code>.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Quick start</h2>
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] shadow-lg font-mono text-sm space-y-2.5">
            {quickstart.map(q => (
              <div key={q.cmd} className="flex items-baseline gap-3 cli-line">
                <span className="text-accent">$</span>
                <code className="text-orangeAccent">{q.cmd}</code>
                <span className="text-gray-600 font-sans text-xs hidden sm:inline">{q.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Requirements</h2>
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] grid sm:grid-cols-3 gap-5 text-sm">
            <div>
              <div className="text-white font-medium mb-1">Python 3.11+</div>
              <div className="text-gray-500 text-xs leading-relaxed">The installer can set this up for you if missing.</div>
            </div>
            <div>
              <div className="text-white font-medium mb-1">Ollama (optional)</div>
              <div className="text-gray-500 text-xs leading-relaxed">Import existing models or let Forge download fresh ones.</div>
            </div>
            <div>
              <div className="text-white font-medium mb-1">8GB+ RAM</div>
              <div className="text-gray-500 text-xs leading-relaxed">More memory means larger models. GPU optional.</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">What you get in v0.2.0</h2>
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] space-y-3.5">
            {[
              'InferForge beta coding model with forge chat',
              'Agentic file tools — create, edit, delete safely',
              '38 CLI commands across models, training, benchmarking',
              'OpenAI-compatible local API on port 11435',
            ].map(item => (
              <p key={item} className="text-gray-400 text-sm flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2.4" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Build everywhere</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {buildTargets.map(t => (
              <div key={t.name} className="bg-white/[0.02] p-5 rounded-xl border border-white/[0.06] hover:border-accent/30 transition-all group hover:bg-white/[0.04]">
                <div className="text-accent font-bold text-sm mb-1.5">{t.name}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
