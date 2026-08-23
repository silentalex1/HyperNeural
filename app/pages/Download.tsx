import Nav from '../components/Nav'
import Footer from '../components/Footer'

const platforms = [
  { label: 'Windows', cmd: 'powershell -ExecutionPolicy Bypass -File .\\scripts\\install.ps1' },
  { label: 'macOS / Linux', cmd: 'bash ./scripts/install.sh' },
  { label: 'pip (editable)', cmd: 'pip install -e .' }
]

const quickstart = [
  'forge import ollama',
  'forge train',
  'forge chat',
  'forge list',
  'forge serve'
]

const buildTargets = [
  { name: 'Desktop', desc: 'Embed AI into desktop applications' },
  { name: 'Website', desc: 'OpenAI-compatible API for web apps' },
  { name: 'Discord', desc: 'AI-powered Discord bots' },
  { name: 'Node.js', desc: 'Server-side AI integration' },
  { name: 'Python', desc: 'Python projects and scripts' },
  { name: 'CLI', desc: 'forge chat · train · run · serve' }
]

export default function Download() {
  return (
    <div className="min-h-screen bg-[#030304] text-white antialiased font-sans flex flex-col justify-between relative overflow-x-hidden">
      <div className="top-right-curve pointer-events-none">
        <svg viewBox="0 0 600 400" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="topRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f7cff" stopOpacity="0" />
              <stop offset="40%" stopColor="#4f7cff" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#8daaff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4f7cff" stopOpacity="0.2" />
            </linearGradient>
            <filter id="topRightGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M 600,0 C 460,130 220,250 0,380" fill="none" stroke="url(#topRightGrad)" strokeWidth="2.5" filter="url(#topRightGlow)" />
        </svg>
      </div>

      <Nav variant="sub" />

      <main className="max-w-3xl mx-auto w-full px-6 py-10 relative z-10 my-auto">
        <h1 className="text-4xl font-extrabold mb-4 text-center tracking-tight">Install InferForge</h1>
        <p className="text-center text-gray-400 mb-12 text-sm">
          Clone the repo, run the installer, then <code className="text-orange-400">forge chat</code>
        </p>

        <div className="space-y-4 mb-16">
          {platforms.map(p => (
            <div key={p.label} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 px-6 rounded-2xl border border-white/[0.06] hover:border-accent/30 shadow-lg py-4">
              <span className="text-accent font-bold font-mono text-sm tracking-wide w-32 shrink-0">{p.label}</span>
              <code className="text-gray-300 font-mono text-xs sm:text-sm bg-black/40 px-4 py-2.5 rounded-xl border border-white/[0.05] selection:bg-accent flex-1 overflow-x-auto">{p.cmd}</code>
            </div>
          ))}
        </div>

        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Quick start</h2>
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] shadow-lg font-mono text-sm space-y-2">
            {quickstart.map(cmd => (
              <div key={cmd} className="text-orange-400">
                <span className="text-gray-600">$</span> {cmd}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Changelog</h2>
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] shadow-lg space-y-3">
            <p className="text-gray-300 font-medium flex items-center gap-3">
              <span className="text-accent font-bold">[+]</span> InferForge beta model + forge chat
            </p>
            <p className="text-gray-300 font-medium flex items-center gap-3">
              <span className="text-accent font-bold">[+]</span> Agentic file tools (create / edit / delete)
            </p>
            <p className="text-gray-300 font-medium flex items-center gap-3">
              <span className="text-accent font-bold">[+]</span> Improved forge train curriculum
            </p>
            <p className="text-gray-300 font-medium flex items-center gap-3">
              <span className="text-accent font-bold">[+]</span> Official beta release
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold mb-5 text-gray-300 tracking-tight">Build Everywhere</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {buildTargets.map(t => (
              <div key={t.name} className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] hover:border-accent/30 transition-all cursor-pointer group hover:bg-white/[0.04]">
                <div className="text-accent font-bold text-sm mb-2">{t.name}</div>
                <div className="text-gray-400 text-xs">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="bottom-arch-container pointer-events-none">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="w-full h-[140px]">
          <defs>
            <linearGradient id="bottomCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f7cff" stopOpacity="0" />
              <stop offset="20%" stopColor="#4f7cff" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#8daaff" stopOpacity="0.95" />
              <stop offset="90%" stopColor="#4f7cff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
            </linearGradient>
            <filter id="bottomCurveGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M 0,180 Q 850,40 1440,160" fill="none" stroke="url(#bottomCurveGrad)" strokeWidth="2.5" filter="url(#bottomCurveGlow)" />
        </svg>
        <div className="bottom-ambient-glow" />
      </div>

      <Footer variant="sub" />
    </div>
  )
}
