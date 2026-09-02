import { Link } from 'react-router-dom'
import {
  Terminal, Zap, Shield, Code, Cpu, Globe, Layers, Database, Activity,
  ArrowRight, Copy, Check, Sparkles, GitBranch, Users
} from 'lucide-react'
import { useState } from 'react'

const quickStartLines = [
  '$ forge pull qwen2.5-coder:7b',
  '$ forge train',
  '$ forge chat',
]

export default function Home() {
  const [copied, setCopied] = useState(false)

  const copyQuickStart = () => {
    navigator.clipboard.writeText(quickStartLines.map(l => l.replace('$ ', '')).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: 'CLI First',
      description: 'A single, composable CLI for training, running, and managing models end to end.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized inference across Native, Ollama, and HuggingFace backends with automatic routing.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'Your models, your data, your hardware. Nothing ever leaves your machine.',
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Developer Friendly',
      description: 'OpenAI-compatible API, Python SDK, and documentation written for real workflows.',
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Smart Training',
      description: 'Nexara DSL for AI-native model configuration, fine-tuning, and evaluation.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Browser Deploy',
      description: 'Ship models to any website with CDN loading and WebGPU inference. No servers required.',
    },
  ]

  const advancedFeatures = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Plugin System',
      description: 'Extend the CLI with custom commands in a single Python file.',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Smart Caching',
      description: 'Automatic prompt and KV caching for dramatically faster repeated queries.',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Usage Analytics',
      description: 'Token usage, performance metrics, and error rates for every model.',
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      title: 'Configuration Profiles',
      description: 'Switch between GPU development and CPU production setups instantly.',
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Model Versioning',
      description: 'Tag training runs, diff iterations, and roll back at any time.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Registry',
      description: 'Share models privately across your organization without public uploads.',
    },
  ]

  const stats = [
    { number: '28+', label: 'Models Supported' },
    { number: '60+', label: 'CLI Commands' },
    { number: '12KB', label: 'Web Deploy Size' },
    { number: '3', label: 'Inference Backends' },
  ]

  return (
    <div className="animated-bg">
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 border border-primary/25 rounded-full text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              v0.3.0 — Plugins, profiles, caching & versioning
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight">
              Local AI, forged
              <br />
              <span className="gradient-text">on your terms</span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Pull a model, train it on your own data, and run it entirely offline.
              No cloud. No telemetry. Just fast local inference.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/download" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/docs" className="btn-secondary text-base px-8 py-3.5 inline-flex items-center gap-2">
                Read the Docs
              </Link>
            </div>

            <div className="mt-16 card max-w-2xl mx-auto text-left p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">terminal</span>
                </div>
                <button
                  onClick={copyQuickStart}
                  aria-label="Copy commands"
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="px-5 py-5 font-mono text-sm space-y-2">
                {quickStartLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="text-gray-600 mr-3 select-none">$</span>
                    <code className="text-accent">{line.replace('$ ', '')}</code>
                  </div>
                ))}
                <div className="pt-1 text-gray-600 text-xs"># That is the whole setup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-1">{stat.number}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Production-ready capabilities for building with local AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card group">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl w-fit mb-5 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Built for serious work</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Advanced tooling that grows with your projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <div key={index} className="card group">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl w-fit mb-5 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card glow bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-primary/25 text-center py-14 px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready to build?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Install InferForge and run your first local model in under a minute.
            </p>
            <Link to="/download" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
              Download Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
