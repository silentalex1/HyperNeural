import { useState } from 'react'
import { Book, Terminal, Code, Zap, Globe, Shield, Cpu, Package, Search, ChevronRight } from 'lucide-react'

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">Getting Started with InferForge</h2>
            <p className="text-gray-400 mb-6">
              InferForge is a local LLM runtime that lets you forge, train, and run AI models entirely on your hardware.
            </p>
          </div>

          <div className="card border border-primary/30">
            <h3 className="text-xl font-semibold mb-3">Installation</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Windows</div>
                <code className="block bg-black/60 px-4 py-3 rounded-lg text-sm">
                  powershell -ExecutionPolicy Bypass -c "irm https://hyperneural.cfd/install.ps1 | iex"
                </code>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">macOS / Linux</div>
                <code className="block bg-black/60 px-4 py-3 rounded-lg text-sm">
                  curl -fsSL https://hyperneural.cfd/install.sh | bash
                </code>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Python (pip)</div>
                <code className="block bg-black/60 px-4 py-3 rounded-lg text-sm">
                  pip install inferforge
                </code>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Quick Start</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2">
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge pull qwen2.5-coder:7b</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge train</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge chat</span></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cli-reference',
      title: 'CLI Reference',
      icon: <Terminal className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4">CLI Command Reference</h2>
          <p className="text-gray-400 mb-6">Complete reference for all 38 InferForge commands.</p>

          {[
            { cmd: 'forge pull', desc: 'Download models from Ollama or HuggingFace with advanced options' },
            { cmd: 'forge import', desc: 'Import models from existing Ollama installation' },
            { cmd: 'forge list', desc: 'List all registered models in your system' },
            { cmd: 'forge train', desc: 'Train or fine-tune models with Nexara DSL' },
            { cmd: 'forge chat', desc: 'Interactive chat with InferForge beta and agent tools' },
            { cmd: 'forge run', desc: 'Run any registered model in chat mode' },
            { cmd: 'forge serve', desc: 'Start OpenAI-compatible API server on port 11435' },
            { cmd: 'forge benchmark', desc: 'Performance testing and model comparison' },
            { cmd: 'forge web', desc: 'Browser deployment commands for CDN-based AI' },
            { cmd: 'forge profile', desc: 'Manage configuration profiles for different workflows' },
            { cmd: 'forge template', desc: 'Manage reusable prompt templates' },
            { cmd: 'forge compare', desc: 'Side-by-side model comparison' },
            { cmd: 'forge optimize', desc: 'Hardware-specific model optimization' },
            { cmd: 'forge cache', desc: 'Manage smart caching layer' },
            { cmd: 'forge stats', desc: 'Usage analytics and performance metrics' }
          ].map((item, idx) => (
            <div key={idx} className="card hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <code className="text-primary font-mono font-semibold">{item.cmd}</code>
                <p className="text-gray-400 text-sm flex-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'web-deployment',
      title: 'Web Deployment',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4">Browser-Based AI Deployment</h2>
          <p className="text-gray-400 mb-6">
            Deploy AI models to websites without servers. Models load from CDN at runtime, keeping your GitHub repos tiny.
          </p>

          <div className="card border border-primary/30 bg-primary/5">
            <h3 className="text-xl font-semibold mb-3">How forge web Works</h3>
            <ol className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">1.</span>
                <span>Models are referenced via CDN URLs (not stored in your repo)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">2.</span>
                <span>Browser downloads and caches models on first use</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">3.</span>
                <span>WebGPU accelerated inference runs entirely client-side</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">4.</span>
                <span>Your repo stays under 100KB - perfect for GitHub Pages</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Example Usage</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2">
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge web init my-ai-app</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge web add qwen2.5-coder:7b --quantize q4_k_m</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge web serve</span></div>
              <div className="text-gray-500">Browser opens at http://localhost:3000</div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Deployment Platforms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Vercel', 'Netlify', 'GitHub Pages', 'Cloudflare Pages'].map(platform => (
                <div key={platform} className="card">
                  <div className="font-semibold">{platform}</div>
                  <div className="text-sm text-gray-400 mt-1">Deploy in seconds with CDN distribution</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <Code className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4">API Reference</h2>
          <p className="text-gray-400 mb-6">
            InferForge provides an OpenAI-compatible REST API at https://hyperneural.cfd/api
          </p>

          <div className="card border border-primary/30">
            <h3 className="text-xl font-semibold mb-3">Base URL</h3>
            <code className="block bg-black/60 px-4 py-3 rounded-lg">
              https://hyperneural.cfd/api/v1
            </code>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Endpoints</h3>
            
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">GET</span>
                  <code className="text-sm">/models</code>
                </div>
                <p className="text-gray-400 text-sm">List all available models</p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">POST</span>
                  <code className="text-sm">/chat/completions</code>
                </div>
                <p className="text-gray-400 text-sm mb-3">Create chat completion</p>
                <div className="bg-black/60 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{`{
  "model": "inferforge-beta",
  "messages": [
    {"role": "user", "content": "Write a binary search"}
  ],
  "stream": false
}`}</pre>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">POST</span>
                  <code className="text-sm">/embeddings</code>
                </div>
                <p className="text-gray-400 text-sm">Generate text embeddings</p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">GET</span>
                  <code className="text-sm">/health</code>
                </div>
                <p className="text-gray-400 text-sm">Health check endpoint</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'training',
      title: 'Training Guide',
      icon: <Cpu className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-4">Training & Fine-Tuning</h2>
          <p className="text-gray-400 mb-6">
            Train custom models using Nexara, InferForge's AI-native training DSL.
          </p>

          <div className="card border border-primary/30">
            <h3 className="text-xl font-semibold mb-3">Nexara Training Example</h3>
            <div className="bg-black/60 p-4 rounded-lg text-sm font-mono overflow-x-auto">
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
            github: 0.6
            leetcode: 0.4
        }
    }
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Training Commands</h3>
            <div className="card bg-black/60 font-mono text-sm space-y-2">
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge train --nexara model.nexara</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge train my-model --data training.json</span></div>
              <div><span className="text-gray-500">$</span> <span className="text-accent">forge train --lora --lora-r 16</span></div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="py-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Documentation</h2>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm font-medium">{section.title}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </nav>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-400 mb-3">Join our community for support</p>
              <a
                href="https://discord.gg/inferforge"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm w-full text-center"
              >
                Join Discord
              </a>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {filteredSections.find(s => s.id === activeSection)?.content}
          </div>
        </main>
      </div>
    </div>
  )
}
