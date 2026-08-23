import { Bot, Cpu, Zap, Package } from 'lucide-react'

export default function Models() {
  const models = [
    {
      name: 'InferForge Beta',
      description: 'Coding assistant with file tools and agent capabilities',
      size: '14.8B',
      quant: 'Q4_K_M',
      features: ['Code Generation', 'File Operations', 'Agent Tools', 'Chat Interface'],
      badge: 'Featured'
    },
    {
      name: 'Qwen2.5-Coder 7B',
      description: 'Excellent coding model, fast and accurate',
      size: '7B',
      quant: 'Q4_K_M',
      features: ['Code Completion', 'Multi-language', 'Fast Inference'],
      badge: 'Popular'
    },
    {
      name: 'Llama 3.1 8B',
      description: 'General purpose model with strong reasoning',
      size: '8B',
      quant: 'Q4_K_M',
      features: ['General Chat', 'Reasoning', 'Writing'],
      badge: null
    },
    {
      name: 'Mistral 7B',
      description: 'Balanced performance for various tasks',
      size: '7B',
      quant: 'Q4_K_M',
      features: ['Chat', 'Summarization', 'Analysis'],
      badge: null
    },
  ]

  const backends = [
    {
      name: 'Native',
      icon: <Zap className="w-6 h-6" />,
      description: 'Direct GGUF execution with llama.cpp',
      pros: ['Fastest inference', 'Full GPU support', 'Memory efficient']
    },
    {
      name: 'Ollama',
      icon: <Bot className="w-6 h-6" />,
      description: 'Seamless integration with Ollama',
      pros: ['Easy model management', 'Auto downloading', 'Wide compatibility']
    },
    {
      name: 'HuggingFace',
      icon: <Package className="w-6 h-6" />,
      description: 'Full transformers library support',
      pros: ['Quantization options', 'Latest models', 'Flexible configs']
    },
  ]

  return (
    <div className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-5xl font-bold mb-4">Our Models</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            28+ models supported. Pull from Ollama or HuggingFace in seconds.
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {models.map((model, index) => (
            <div key={index} className="card group hover:glow">
              {model.badge && (
                <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold mb-3">
                  {model.badge}
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{model.name}</h3>
              <p className="text-gray-400 mb-4">{model.description}</p>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>{model.size} params</span>
                </div>
                <div className="text-gray-500">•</div>
                <div>{model.quant}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {model.features.map((feature, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-sm">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <code className="text-sm text-accent">
                  forge pull {model.name.toLowerCase().replace(/\s+/g, '-')}
                </code>
              </div>
            </div>
          ))}
        </div>

        {/* Backends Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Multiple Inference Backends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {backends.map((backend, index) => (
              <div key={index} className="card">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl inline-block mb-4">
                  {backend.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{backend.name}</h3>
                <p className="text-gray-400 mb-4 text-sm">{backend.description}</p>
                <ul className="space-y-2">
                  {backend.pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-gray-300">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 text-center">
          <h3 className="text-2xl font-bold mb-4">Want to add your model?</h3>
          <p className="text-gray-400 mb-6">
            InferForge supports any GGUF model. Simply pull it and start using.
          </p>
          <a
            href="/docs"
            className="btn-primary inline-block"
          >
            View Documentation →
          </a>
        </div>
      </div>
    </div>
  )
}
