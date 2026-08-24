import { Bot, Cpu, Zap, Package, Check, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Models() {
  const models = [
    {
      name: 'InferForge Beta',
      pull: 'inferforge-beta',
      description: 'Our flagship coding assistant with file tools and agent capabilities.',
      size: '14.8B',
      quant: 'Q4_K_M',
      features: ['Code Generation', 'File Operations', 'Agent Tools', 'Chat Interface'],
      badge: 'Featured',
    },
    {
      name: 'Qwen2.5-Coder 7B',
      pull: 'qwen2.5-coder:7b',
      description: 'Excellent coding model. Fast, accurate, and multilingual.',
      size: '7B',
      quant: 'Q4_K_M',
      features: ['Code Completion', 'Multi-language', 'Fast Inference'],
      badge: 'Popular',
    },
    {
      name: 'Llama 3.1 8B',
      pull: 'llama3.1:8b',
      description: 'General purpose model with strong reasoning and writing.',
      size: '8B',
      quant: 'Q4_K_M',
      features: ['General Chat', 'Reasoning', 'Writing'],
      badge: null,
    },
    {
      name: 'Mistral 7B',
      pull: 'mistral:7b',
      description: 'Balanced performance for chat, summarization, and analysis.',
      size: '7B',
      quant: 'Q4_K_M',
      features: ['Chat', 'Summarization', 'Analysis'],
      badge: null,
    },
  ]

  const backends = [
    {
      name: 'Native',
      icon: <Zap className="w-6 h-6" />,
      description: 'Direct GGUF execution via llama.cpp.',
      pros: ['Fastest inference', 'Full GPU support', 'Memory efficient'],
    },
    {
      name: 'Ollama',
      icon: <Bot className="w-6 h-6" />,
      description: 'Seamless integration with an existing Ollama install.',
      pros: ['Easy model management', 'Automatic downloads', 'Wide compatibility'],
    },
    {
      name: 'HuggingFace',
      icon: <Package className="w-6 h-6" />,
      description: 'Full transformers library support with quantization options.',
      pros: ['Latest models', 'Flexible configs', 'Quantization control'],
    },
  ]

  return (
    <div className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mb-6 shadow-lg shadow-primary/10">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Model Library</h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            28+ models supported. Pull from Ollama or HuggingFace in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {models.map((model, index) => (
            <div key={index} className="card group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold">{model.name}</h3>
                {model.badge && (
                  <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-xs font-semibold border border-primary/25">
                    {model.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-5 leading-relaxed">{model.description}</p>

              <div className="flex items-center gap-4 mb-5 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-primary" />
                  {model.size}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span>{model.quant}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {model.features.map((feature, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <code className="text-sm text-accent font-mono">forge pull {model.pull}</code>
                <CopyableCommand command={`forge pull ${model.pull}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center tracking-tight">Three inference backends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {backends.map((backend, index) => (
              <div key={index} className="card">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl w-fit mb-5 shadow-md shadow-primary/20">
                  {backend.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{backend.name}</h3>
                <p className="text-gray-400 mb-5 text-sm leading-relaxed">{backend.description}</p>
                <ul className="space-y-2.5">
                  {backend.pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/25 text-center py-12">
          <h3 className="text-2xl font-bold mb-3">Have a GGUF model?</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            InferForge runs any GGUF checkpoint. Pull it, import it, or point it at a local file.
          </p>
          <Link to="/docs" className="btn-primary inline-flex items-center gap-2">
            Read the Docs
          </Link>
        </div>
      </div>
    </div>
  )
}

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      aria-label="Copy command"
      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}
