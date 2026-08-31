import { useState } from 'react'
import {
  Book, Terminal, Code, Globe, Search, ChevronRight,
  GitBranch, Wrench, FlaskConical, Users, GraduationCap, Boxes
} from 'lucide-react'

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-4 h-4" />,
      keywords: 'install setup quickstart',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Getting Started</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              InferForge is a local LLM runtime that lets you forge, train, and run AI models entirely on your own hardware.
            </p>
          </div>

          <div className="card border-white/[0.06]">
            <h3 className="text-xl font-semibold mb-4">Installation</h3>
            <div className="space-y-4">
              {[
                { label: 'Windows (PowerShell)', cmd: 'powershell -c "irm https://hyperneural.cfd/install.ps1 | iex"' },
                { label: 'macOS / Linux', cmd: 'curl -fsSL https://hyperneural.cfd/install.sh | bash' },
                { label: 'Python (pip)', cmd: 'pip install inferforge' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-sm text-gray-400 mb-2">{item.label}</div>
                  <code className="block bg-black/60 px-4 py-3 rounded-lg text-sm text-accent border border-white/10 overflow-x-auto whitespace-nowrap">
                    {item.cmd}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Quick Start</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {['forge pull qwen2.5-coder:7b', 'forge train', 'forge chat'].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cli-reference',
      title: 'CLI Reference',
      icon: <Terminal className="w-4 h-4" />,
      keywords: 'commands reference pull train chat serve',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">CLI Command Reference</h2>
          <p className="text-gray-400 mb-6">Every command available in the forge CLI.</p>

          {[
            { cmd: 'forge pull', desc: 'Download models from Ollama or HuggingFace with advanced options' },
            { cmd: 'forge import ollama', desc: 'Import models from an existing Ollama installation' },
            { cmd: 'forge list', desc: 'List all registered models in your system' },
            { cmd: 'forge run <model>', desc: 'Run any registered model in chat mode' },
            { cmd: 'forge chat', desc: 'Interactive chat with agent tools and file access' },
            { cmd: 'forge serve', desc: 'Start the OpenAI-compatible API server on port 11435' },
            { cmd: 'forge train', desc: 'Train or fine-tune models with the Nexara DSL' },
            { cmd: 'forge benchmark', desc: 'Performance testing and model comparison' },
            { cmd: 'forge create', desc: 'Create a new model from scratch' },
            { cmd: 'forge embedd', desc: 'Embed model weights for portable use' },
            { cmd: 'forge nexara', desc: 'Nexara AI-native programming language tooling' },
            { cmd: 'forge merge a b --name fused --verify', desc: 'Merge two models with TIES/SLERP and verify tensors' },
            { cmd: 'forge train --dry-run --data tiny.json', desc: 'Validate a training plan without contacting Ollama' },
            { cmd: 'forge serve', desc: 'API on :11435 plus web UI at /ui' },
            { cmd: 'forge benchmark run <model>', desc: 'Measure tokens/sec, latency, and memory' },
            { cmd: 'forge doctor', desc: 'Diagnose backends, GPU, and missing deps' },
            { cmd: 'forge feedback', desc: 'Save anonymous local diagnostics' },
          ].map((item, idx) => (
            <div key={idx} className="card hover:border-white/[0.10] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <code className="text-primary font-mono font-semibold whitespace-nowrap">{item.cmd}</code>
                <p className="text-gray-400 text-sm flex-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'profiles-plugins',
      title: 'Profiles & Plugins',
      icon: <Wrench className="w-4 h-4" />,
      keywords: 'profiles plugins caching preload optimize quantization',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Profiles, Plugins & Performance</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Tailor InferForge to each workflow: switch hardware profiles, extend the CLI, cache aggressively, and optimize quantization.
          </p>

          <div className="card border border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-3">Configuration Profiles</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {[
                'forge profile create gpu-dev --backend native --gpu-layers 35',
                'forge profile create cpu-prod --backend ollama --threads 8',
                'forge profile use gpu-dev',
              ].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card border border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-3">Custom Plugins</h3>
            <p className="text-gray-400 text-sm mb-3">
              Drop a Python file into ~/.inferforge/plugins to register new commands.
            </p>
            <div className="bg-black/60 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-white/10">
              <pre>{`from inferforge.plugins import ForgePlugin

class MyPlugin(ForgePlugin):
    @forge_command("analyze")
    def analyze_code(self, path: str):
        ...`}</pre>
            </div>
          </div>

          <div className="card border border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-3">Caching & Preloading</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {[
                'forge run llama3.1 --cache-embeddings --cache-kv',
                'forge cache stats',
                'forge cache clear',
                'forge preload qwen2.5-coder llama3.1 mistral',
              ].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card border border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-3">Quantization Optimizer</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {[
                'forge optimize my-model --target-size 4GB --benchmark',
                'forge optimize --profile speed',
                'forge optimize --profile balanced',
                'forge optimize --platform apple-silicon',
              ].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'versioning',
      title: 'Model Versioning',
      icon: <GitBranch className="w-4 h-4" />,
      keywords: 'version rollback diff history tags',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Model Versioning & Rollback</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Every training run can be tagged. Compare iterations, inspect changes, and restore any earlier version.
          </p>

          <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
            {[
              'forge train my-model --version v1.2.3',
              'forge model history my-model',
              'forge model diff my-model v1.2.2 v1.2.3',
              'forge model rollback my-model v1.2.2',
            ].map(cmd => (
              <div key={cmd}>
                <span className="text-gray-600 mr-2">$</span>
                <span className="text-accent">{cmd}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'training',
      title: 'Training Guide',
      icon: <GraduationCap className="w-4 h-4" />,
      keywords: 'train curriculum synthetic data monitor dataset nexara lora',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Training & Fine-Tuning</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Train custom models using Nexara, InferForge's AI-native training DSL, with curriculums, synthetic data, and live monitoring.
          </p>

          <div className="card border-white/[0.06]">
            <h3 className="text-xl font-semibold mb-3">Nexara Training Example</h3>
            <div className="bg-black/60 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-white/10">
              <pre>{`model MyCoder {
    base: "qwen2.5-coder:7b"
    task: "code-completion"

    training {
        epochs: 3
        learning_rate: 0.0001
        batch_size: 4
    }

    dataset {
        sources {
            codebase: 0.6
            leetcode: 0.4
        }
    }
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Training Commands</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {[
                'forge train --nexara model.nexara',
                'forge train my-model --data training.json --monitor',
                'forge train --lora --lora-r 16',
                'forge curriculum create my-curriculum',
                'forge curriculum add-stage basic --data basic_qa.json --epochs 2',
                'forge train --curriculum my-curriculum --auto-advance',
                'forge generate-data --topic "Python coding" --count 1000',
              ].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'team-quality',
      title: 'Teams & Testing',
      icon: <Users className="w-4 h-4" />,
      keywords: 'team registry test quality compare explore recipes learn keys stats docker git',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Teams, Testing & Workflow Tools</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Collaborate privately, guard quality with automated tests, and speed up daily work with templates, comparisons, and git integration.
          </p>

          {[
            {
              title: 'Team Model Registry',
              cmds: ['forge team init', 'forge team push my-model --private', 'forge team pull org/shared-model', 'forge team list --organization my-company'],
            },
            {
              title: 'Model Testing Framework',
              cmds: ['forge test my-model --benchmark coding', 'forge test my-model --custom tests/my_tests.json', 'forge test compare baseline-model my-model'],
            },
            {
              title: 'Comparison & Exploration',
              cmds: ['forge compare qwen2.5-coder llama3.1 --prompt "Write a binary search"', 'forge explore llama3.1', 'forge template add code-review "Review this code:\\n{code}"'],
            },
            {
              title: 'Git Integration',
              cmds: ['forge commit-msg', 'forge review --diff HEAD~1', 'forge changelog --auto', 'forge pr-summary'],
            },
            {
              title: 'Learning & Recipes',
              cmds: ['forge learn basics', 'forge learn deployment', 'forge recipe search "code assistant"', 'forge recipe install amazing-coding-assistant'],
            },
            {
              title: 'Deployment & Containers',
              cmds: ['forge docker build my-model --tag my-org/my-model:v1', 'forge kubernetes deploy my-model --replicas 3', 'forge doctor --fix-gpu'],
            },
          ].map(group => (
            <div key={group.title} className="card border-white/[0.06]">
              <h3 className="text-lg font-semibold mb-3">{group.title}</h3>
              <div className="space-y-1.5 font-mono text-sm">
                {group.cmds.map(cmd => (
                  <div key={cmd} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <code className="text-accent break-all">{cmd}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'web-deployment',
      title: 'Web Deployment',
      icon: <Globe className="w-4 h-4" />,
      keywords: 'web browser webgpu progressive ensemble cascade static hosting',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Browser-Based AI Deployment</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Deploy AI to any website without servers. Models load from a CDN at runtime and inference runs client-side with WebGPU.
          </p>

          <div className="card border-white/[0.06] bg-primary/5">
            <h3 className="text-xl font-semibold mb-4">How it works</h3>
            <ol className="space-y-3 text-gray-400">
              {[
                'Models are referenced via CDN URLs, not stored in your project.',
                'Browsers download and cache the model on first use.',
                'WebGPU accelerated inference runs entirely client-side.',
                'Your deploy stays under 100KB, perfect for static hosting.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Commands</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
              {[
                'forge web init my-ai-app',
                'forge web add qwen2.5-coder:7b --progressive',
                'forge web add-ensemble small large --strategy vote',
                'forge web add-cascade small large --threshold 0.8',
                'forge web optimize --measure',
                'forge web serve',
              ].map(cmd => (
                <div key={cmd}>
                  <span className="text-gray-600 mr-2">$</span>
                  <span className="text-accent">{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Deployment Platforms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Vercel', 'Netlify', 'Cloudflare Pages', 'Railway'].map(platform => (
                <div key={platform} className="card flex items-center gap-3">
                  <Boxes className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold">{platform}</div>
                    <div className="text-sm text-gray-400">Static hosting with CDN distribution</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <Code className="w-4 h-4" />,
      keywords: 'api rest endpoints openai compatible server embeddings completions',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">API Reference</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            InferForge ships an OpenAI-compatible REST API served locally by `forge serve`.
          </p>

          <div className="card border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Base URL</h3>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-primary/15 text-primary border border-primary/20">production</span>
            </div>
            <code className="block bg-black/60 px-4 py-3 rounded-lg font-mono text-sm border border-white/10 flex items-center justify-between gap-3">
              <span>https://hyperneural.cfd/v1</span>
              <span className="text-[11px] text-white/30 hidden sm:inline">OpenAI-compatible</span>
            </code>
            <p className="text-xs text-white/40 mt-2">Local serve still available at <span className="font-mono text-white/60">http://localhost:11435/v1</span> when you run <span className="font-mono text-primary">forge serve</span></p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Endpoints</h3>
            <div className="space-y-4">
              {[
                { method: 'GET', cls: 'bg-green-500/20 text-green-400', path: '/models', desc: 'List all available models' },
                { method: 'POST', cls: 'bg-blue-500/20 text-blue-400', path: '/chat/completions', desc: 'Create a chat completion' },
                { method: 'POST', cls: 'bg-blue-500/20 text-blue-400', path: '/embeddings', desc: 'Generate text embeddings' },
                { method: 'GET', cls: 'bg-green-500/20 text-green-400', path: '/health', desc: 'Health check endpoint' },
              ].map(ep => (
                <div key={ep.path} className="card">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`px-3 py-1 ${ep.cls} text-xs font-mono rounded`}>
                      {ep.method}
                    </span>
                    <code className="text-sm">{ep.path}</code>
                  </div>
                  <p className="text-gray-400 text-sm">{ep.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-white/[0.06]">
            <h3 className="text-xl font-semibold mb-3">Example Request</h3>
            <div className="bg-black/60 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-white/10">
              <pre>{`{
  "model": "inferforge-beta",
  "messages": [
    {"role": "user", "content": "Write a binary search"}
  ],
  "stream": false
}`}</pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <FlaskConical className="w-4 h-4" />,
      keywords: 'doctor gpu fix diagnostics problems errors',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Troubleshooting</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Diagnose your environment and fix common GPU issues automatically.
          </p>

          <div className="card bg-black/60 font-mono text-sm space-y-2 border border-white/10">
            {[
              'forge doctor',
              'forge doctor --fix-gpu',
              'forge show <model>',
              'forge paths',
            ].map(cmd => (
              <div key={cmd}>
                <span className="text-gray-600 mr-2">$</span>
                <span className="text-accent">{cmd}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Apple Silicon', body: 'Metal acceleration is detected automatically. Use forge optimize --platform apple-silicon for best settings.' },
              { title: 'Windows GPU', body: 'DirectML and CUDA are auto-detected. Run forge doctor --fix-gpu to resolve common driver issues.' },
            ].map(item => (
              <div key={item.title} className="card">
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.keywords.includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-[240px] flex-shrink-0">
            <div className="lg:sticky lg:top-[84px] space-y-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/15 focus:bg-white/[0.06] transition"
                />
              </div>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition ${
                      activeSection === section.id
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={activeSection === section.id ? 'text-black/60' : 'text-white/30'}>{section.icon}</span>
                    <span className="text-[13px]">{section.title}</span>
                  </button>
                ))}
              </nav>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 hidden lg:block">
                <h3 className="text-sm font-semibold text-white mb-1.5">Need help?</h3>
                <p className="text-xs leading-5 text-white/45 mb-4">Join Discord. Response within 24h for beta users.</p>
                <a href="https://discord.gg/Nc9fqvRM68" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition">
                  Join Discord
                </a>
              </div>
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center py-16 text-white/40 text-sm">No sections match your search.</div>
            ) : (
              filteredSections.map(section => (
                <div key={section.id} className={section.id === activeSection ? '' : 'hidden'}>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8">
                    {section.content}
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
