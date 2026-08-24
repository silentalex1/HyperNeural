import { useState, useEffect, useRef } from 'react'

interface Cmd {
  name: string
  desc: string
  example?: string
  options?: string[]
  code?: { lang: string; content: string }
}

interface Section {
  id: string
  title: string
  intro?: string
  commands?: Cmd[]
  code?: { lang: string; content: string }
  bullets?: string[]
}

const sections: Section[] = [
  {
    id: 'installation',
    title: 'Installation',
    intro: 'InferForge installs as a single forge command. Pick the method for your platform — all three give you the same CLI.',
    code: {
      lang: 'bash',
      content:
        'Windows (PowerShell)\npowershell -c "irm https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.ps1 | iex"\n\nmacOS / Linux\ncurl -fsSL https://raw.githubusercontent.com/silentalex1/HyperNeural/main/scripts/install.sh | bash\n\npip (any platform, Python 3.11+)\npip install git+https://github.com/silentalex1/HyperNeural.git',
    },
    bullets: [
      'The scripts check for Python 3.11+ and install it if missing.',
      'pipx is supported too: pipx install git+https://github.com/silentalex1/HyperNeural.git',
      'Verify with forge --version after installing.',
    ],
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    intro: 'From zero to chatting in three commands.',
    code: {
      lang: 'bash',
      content:
        'forge import ollama              # bring in models you already have\nforge train                      # build InferForge beta\nforge chat                       # agent chat with file tools',
    },
  },
  {
    id: 'models',
    title: 'Model Management',
    commands: [
      {
        name: 'forge import ollama',
        desc: 'Import all Ollama models into the Forge registry.',
        example: 'forge import ollama --filter "qwen*"',
      },
      {
        name: 'forge pull <model>',
        desc: 'Download a model from Ollama, HuggingFace, or a direct URL.',
        example: 'forge pull qwen2.5-coder:7b',
        options: ['--force — re-download', '--into-forge — copy into the Forge directory', '--host <url> — custom Ollama host'],
      },
      {
        name: 'forge list',
        desc: 'List every registered model.',
        example: 'forge list --filter "qwen*" --json',
      },
      {
        name: 'forge show <model>',
        desc: 'Show digest, backend, quantization, context length, size, path, and capabilities for a model.',
        example: 'forge show inferforge-beta',
      },
      {
        name: 'forge remove <model>',
        desc: 'Remove a model from the registry.',
        example: 'forge remove old-model',
      },
    ],
  },
  {
    id: 'inference',
    title: 'Inference & Chat',
    commands: [
      {
        name: 'forge run <model>',
        desc: 'Start an interactive chat session with any registered model.',
        example: 'forge run llama3.1:8b --system "You are a helpful assistant"',
        options: ['run inferforge-beta is valid shorthand', '--no-animation skips the boot animation', '--verbose shows diagnostics'],
      },
      {
        name: 'forge chat',
        desc: 'Open the InferForge beta agent. It can create, edit, and delete files, run commands, and make web requests.',
        example: 'forge chat --base qwen2.5-coder:14b',
        options: ['Slash commands: /help /clear /model /tools /pwd /cd <path> /exit'],
      },
      {
        name: 'forge serve',
        desc: 'Run an OpenAI-compatible API server on port 11435.',
        example: 'forge serve --port 8080 --host 0.0.0.0',
        options: ['GET /v1/models', 'POST /v1/chat/completions', 'GET /v2/models/capabilities', 'POST /v2/benchmark'],
      },
    ],
  },
  {
    id: 'training',
    title: 'Training & Customization',
    commands: [
      {
        name: 'forge train',
        desc: 'Train or rebuild InferForge beta on a coding + agent curriculum.',
        example: 'forge train my-model --data examples.json --epochs 3',
        options: ['--base <model>', '--data <file>', '--epochs <n> (default 3)', '--batch-size <n> (default 4)', '--learning-rate <f>', '--export-dataset coding.json'],
      },
      {
        name: 'forge create <name>',
        desc: 'Create a derived model using Ollama\u2019s create API.',
        example: 'forge create coding-assistant --base qwen2.5-coder:7b',
      },
      {
        name: 'forge nexara',
        desc: 'Compile, validate, and train with Nexara — an AI-native config language.',
        example: 'forge nexara compile model.nexara',
        code: {
          lang: 'text',
          content: '@nexara\nmodel MyModel {\n    base: "qwen2.5-coder:7b"\n    task: "code-completion"\n\n    training {\n        epochs: 3\n        batch_size: 4\n        learning_rate: 0.0001\n        optimizer: "adamw"\n    }\n\n    hardware {\n        prefer_gpu: true\n        mixed_precision: true\n    }\n}',
        },
      },
    ],
  },
  {
    id: 'benchmarking',
    title: 'Benchmarking',
    intro: 'Measure tokens per second, first-token latency, duration, memory usage, and GPU utilization.',
    commands: [
      {
        name: 'forge benchmark run <model>',
        desc: 'Benchmark a single model.',
        example: 'forge benchmark run qwen2.5-coder:7b --runs 5',
      },
      {
        name: 'forge benchmark compare <models...>',
        desc: 'Compare multiple models side by side.',
        example: 'forge benchmark compare qwen2.5-coder:7b llama3.1:8b mistral:7b',
      },
      {
        name: 'forge benchmark backends <model>',
        desc: 'Compare native, Ollama, and HuggingFace backends for the same model.',
        example: 'forge benchmark backends qwen2.5-coder:7b',
      },
      {
        name: 'forge benchmark suite <model>',
        desc: 'Run the standard benchmark suite.',
        example: 'forge benchmark suite qwen2.5-coder:7b --output results.json',
      },
    ],
  },
  {
    id: 'registry',
    title: 'Registry & Sync',
    commands: [
      {
        name: 'forge registry status',
        desc: 'Show synchronization status between local and remote registries.',
        example: 'forge registry status',
      },
      {
        name: 'forge registry push / pull',
        desc: 'Push or pull models to and from a remote registry.',
        example: 'forge registry push qwen2.5-coder:7b',
      },
      {
        name: 'forge registry sync',
        desc: 'Sync all models. Conflicts can be resolved manually or automatically.',
        example: 'forge registry sync --auto-resolve',
        options: ['--remote <url>', '--force', '--dry-run'],
      },
      {
        name: 'forge registry versions / list-remote / delete-remote',
        desc: 'Inspect version history and manage remote entries.',
        example: 'forge registry versions qwen2.5-coder:7b',
      },
    ],
  },
  {
    id: 'web',
    title: 'Web Deployment',
    intro: 'Ship browser-based AI apps where models load progressively from a CDN — repos stay around 12KB.',
    commands: [
      {
        name: 'forge web init <name>',
        desc: 'Scaffold a browser-AI project.',
        example: 'forge web init my-website --template react',
      },
      {
        name: 'forge web add <model>',
        desc: 'Add a CDN-loaded model reference without downloading weights.',
        example: 'forge web add TheBloke/CodeLlama-7B-Instruct-GGUF --quantize q4_k_m',
        options: ['--cdn custom --url <url>'],
      },
      {
        name: 'forge web serve',
        desc: 'Start a local dev server for your web project.',
        example: 'forge web serve --port 3000',
      },
      {
        name: 'forge web build / deploy',
        desc: 'Build for production and deploy to Vercel, Netlify, or GitHub Pages.',
        example: 'forge web deploy --platform vercel',
      },
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities',
    commands: [
      { name: 'forge version', desc: 'Print the InferForge version.', example: 'forge version' },
      {
        name: 'forge paths',
        desc: 'Show data directory, model directories, registry, settings, Ollama host, and API port.',
        example: 'forge paths',
      },
      {
        name: 'forge storage',
        desc: 'Manage cloud storage backends such as S3-compatible buckets.',
        example: 'forge storage setup',
        options: ['status', 'upload <model>', 'download <model>'],
      },
      {
        name: 'forge remote',
        desc: 'Manage remote model registries.',
        example: 'forge remote add origin https://registry.example.com',
        options: ['list', 'remove <name>', 'set-default <name>'],
      },
      {
        name: 'forge embedd <model>',
        desc: 'Embed model weights for portable single-file use.',
        example: 'forge embedd qwen2.5-coder:7b --output portable.gguf',
      },
      {
        name: 'forge help',
        desc: 'AI-powered help that asks InferForge beta directly.',
        example: 'forge help "What\u2019s the difference between run and chat?"',
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Common Workflows',
    code: {
      lang: 'bash',
      content:
        'Pull and run\nforge pull qwen2.5-coder:7b && forge run qwen2.5-coder:7b\n\nTrain the beta model\nforge import ollama && forge train && forge chat\n\nCreate a custom assistant\nforge create my-assistant --base qwen2.5-coder:7b && forge run my-assistant\n\nSync models across machines\nforge registry push qwen2.5-coder:7b\nforge registry pull qwen2.5-coder:7b',
    },
  },
]

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-black/50 border border-white/[0.06] rounded-xl p-5 overflow-x-auto font-mono text-[13px] leading-relaxed text-gray-300 whitespace-pre">
        {content}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-gray-400 hover:text-white"
      >
        {copied ? (
          <>
            <svg width="12" height="12" fill="none" stroke="#22c55e" strokeWidth="2.4" viewBox="0 0 24 24">
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
  )
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [query, setQuery] = useState('')
  const [showTop, setShowTop] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // Scroll-spy: highlight the sidebar entry for the section in view
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 600)
      let current = sections[0]?.id || ''
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 140) current = s.id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Filter sections by search query (titles, intros, command names)
  const q = query.toLowerCase().trim()
  const filtered = q
    ? sections.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.intro?.toLowerCase().includes(q) ||
        s.commands?.some(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
      )
    : sections

  const activeIndex = sections.findIndex(s => s.id === activeSection)

  return (
    <div className="relative overflow-x-hidden page-fade-in">
      <div className="fixed top-[-200px] right-[-100px] w-[600px] h-[400px] z-[-1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(79,124,255,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 py-14 w-full relative z-10 flex gap-12">

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4 px-3">Documentation</p>

            {/* Search */}
            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search docs..."
                className="search-input w-full text-white placeholder-gray-600 text-xs rounded-lg py-2.5 pl-9 pr-3 border border-white/[0.08] focus:border-accent focus:outline-none transition-all"
              />
            </div>

            <nav className="space-y-0.5">
              {filtered.map(s => {
                const idx = sections.findIndex(x => x.id === s.id)
                const active = activeSection === s.id
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                      active
                        ? 'text-white bg-accent/[0.12] border border-accent/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={`font-mono text-[10px] w-5 text-right shrink-0 ${active ? 'text-accent' : 'text-gray-700 group-hover:text-gray-500'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate">{s.title}</span>
                    {active && <span className="ml-auto w-1 h-1 rounded-full bg-accent shrink-0" />}
                  </a>
                )
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-600">No sections match “{query}”.</p>
              )}
            </nav>

            {/* Reading progress */}
            <div className="mt-8 px-3">
              <div className="flex justify-between text-[10px] text-gray-600 mb-2">
                <span>Progress</span>
                <span className="font-mono">{activeIndex + 1} / {sections.length}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${((activeIndex + 1) / sections.length) * 100}%`, boxShadow: '0 0 8px rgba(79,124,255,0.5)' }}
                />
              </div>
            </div>
          </div>
        </aside>

// __DOCS_MAIN_MARKER__

        {/* Main content */}
        <main ref={mainRef} className="flex-1 min-w-0 max-w-3xl">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Documentation</h1>
            <p className="text-gray-500 leading-relaxed">
              Everything you need to install, run, train, and deploy with InferForge v0.2.0.
              Every command also accepts <code className="font-mono text-sm text-gray-300">--help</code>.
            </p>
          </header>

          {/* Mobile section chips */}
          <div className="lg:hidden mb-10 -mx-6 px-6 overflow-x-auto nice-scroll">
            <div className="flex gap-2 w-max pb-2">
              {filtered.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    activeSection === s.id
                      ? 'text-white bg-accent/[0.15] border-accent/25'
                      : 'text-gray-500 border-white/[0.08] hover:text-white'
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {q && (
            <p className="text-xs text-gray-600 mb-8">
              {filtered.length} section{filtered.length === 1 ? '' : 's'} matching “{query}”
              <button onClick={() => setQuery('')} className="ml-3 text-accent hover:text-accentHover">Clear</button>
            </p>
          )}

          <div className="space-y-14 pb-20">
            {filtered.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-4 mb-5 pb-3 border-b border-white/[0.06]">
                  <span className="font-mono text-xs text-accent bg-accent/[0.08] border border-accent/15 rounded-lg px-2.5 py-1.5 shrink-0">
                    {String(sections.findIndex(s => s.id === section.id) + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                </div>
// __DOCS_SECTIONS_MARKER__

                {section.intro && <p className="text-gray-500 text-sm leading-relaxed mb-6">{section.intro}</p>}

                {section.code && (
                  <div className="mb-6">
                    <CodeBlock content={section.code.content} />
                  </div>
                )}

                {section.bullets && (
                  <ul className="space-y-2.5 mb-6 bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                    {section.bullets.map(b => (
                      <li key={b} className="text-sm text-gray-400 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {section.commands && (
                  <div className="space-y-4 mt-6">
                    {section.commands.map(cmd => (
                      <div
                        key={cmd.name}
                        className="bg-white/[0.02] hover:bg-white/[0.035] border border-white/[0.05] hover:border-accent/25 rounded-xl p-5 transition-all duration-200"
                      >
                        <h3 className="font-mono text-[14px] font-semibold text-white mb-2 flex items-center gap-2">
                          <span className="text-accent select-none">$</span>{cmd.name}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">{cmd.desc}</p>
                        {cmd.example && (
                          <pre className="bg-black/50 border border-white/[0.05] rounded-lg px-4 py-3 font-mono text-xs text-orangeAccent overflow-x-auto nice-scroll mb-3 whitespace-pre">
                            {cmd.example}
                          </pre>
                        )}
                        {cmd.options && (
                          <div className="flex flex-wrap gap-2">
                            {cmd.options.map(o => (
                              <span key={o} className="text-[11px] text-gray-500 font-mono bg-black/40 border border-white/[0.05] rounded-md px-2 py-1">
                                {o}
                              </span>
                            ))}
                          </div>
                        )}
                        {cmd.code && <div className="mt-3"><CodeBlock content={cmd.code.content} /></div>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-600 py-16 text-sm border border-white/[0.05] rounded-2xl bg-white/[0.02]">
                Nothing found for “{query}”. Try a command like <span className="font-mono text-gray-400">forge pull</span>.
              </div>
            )}

            <section className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-8">
              <h2 className="text-xl font-bold tracking-tight mb-2">Need a hand?</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-1">
                Ask the model itself: <code className="font-mono text-gray-300">forge help "your question"</code>, or join the Discord from the footer below.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-[#0d0d12] border border-white/[0.1] text-gray-400 hover:text-white hover:border-accent/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}

