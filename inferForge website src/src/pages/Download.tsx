import { Copy, Check, Download as DownloadIcon, Terminal, Package, Zap } from 'lucide-react'
import { useState } from 'react'

export default function Download() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const installations = [
    {
      id: 'windows',
      platform: 'Windows',
      icon: <Package className="w-5 h-5" />,
      command: 'powershell -ExecutionPolicy Bypass -c "irm https://hyperneural.cfd/install.ps1 | iex"',
      description: 'PowerShell one-line installer'
    },
    {
      id: 'macos',
      platform: 'macOS',
      icon: <Terminal className="w-5 h-5" />,
      command: 'curl -fsSL https://hyperneural.cfd/install.sh | bash',
      description: 'Homebrew-style installer for Mac'
    },
    {
      id: 'linux',
      platform: 'Linux',
      icon: <Terminal className="w-5 h-5" />,
      command: 'curl -fsSL https://hyperneural.cfd/install.sh | bash',
      description: 'Universal bash installer'
    },
    {
      id: 'pip',
      platform: 'pip',
      icon: <Zap className="w-5 h-5" />,
      command: 'pip install inferforge',
      description: 'Install via Python package manager'
    }
  ]

  const quickstart = [
    { cmd: 'forge import ollama', desc: 'Import existing Ollama models' },
    { cmd: 'forge pull qwen2.5-coder:7b', desc: 'Download a model from HuggingFace' },
    { cmd: 'forge train', desc: 'Train InferForge beta with coding curriculum' },
    { cmd: 'forge chat', desc: 'Start interactive chat with agent tools' },
    { cmd: 'forge serve', desc: 'Start OpenAI-compatible API server' },
  ]

  return (
    <div className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mb-6">
          <DownloadIcon className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Install InferForge</h1>
        <p className="text-xl text-gray-400">
          Get started in under 60 seconds
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {installations.map((install) => (
          <div key={install.id} className="card group hover:glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {install.icon}
              </div>
              <div>
                <div className="font-bold">{install.platform}</div>
                <div className="text-sm text-gray-400">{install.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-black/60 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto text-gray-300 border border-white/10">
                {install.command}
              </code>
              <button
                onClick={() => copyToClipboard(install.command, install.id)}
                className="p-3 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Copy to clipboard"
              >
                {copied === install.id ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Quick Start Guide</h2>
        </div>
        
        <div className="card bg-black/60 font-mono text-sm border border-white/10">
          {quickstart.map((item, index) => (
            <div key={index} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-gray-500 select-none">$</span>
              <div className="flex-1">
                <code className="text-accent">{item.cmd}</code>
                <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Latest Release: v0.2.0</h2>
        <div className="card space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b border-white/10">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <strong>Browser Deployment (forge web)</strong>
              <p className="text-gray-400 text-sm mt-1">Deploy AI models to websites with CDN loading. Keep your repos tiny and GitHub-friendly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pb-4 border-b border-white/10">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <strong>Enhanced Pull Command</strong>
              <p className="text-gray-400 text-sm mt-1">14 advanced options including quantization, optimization, verification, and parallel downloads.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pb-4 border-b border-white/10">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <strong>Nexara Training System</strong>
              <p className="text-gray-400 text-sm mt-1">6-stage curriculum learning with 350+ parameters and 8 advanced training systems.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <strong>38 Total Commands</strong>
              <p className="text-gray-400 text-sm mt-1">Comprehensive CLI covering import, pull, train, serve, benchmark, web deployment, and more.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
