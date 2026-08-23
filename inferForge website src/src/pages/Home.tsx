import { Link } from 'react-router-dom'
import { Terminal, Zap, Shield, Code, Cpu, Globe } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: 'CLI First',
      description: 'Simple, powerful CLI for training, running, and managing AI models'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Optimized inference with multiple backends: Native, Ollama, HuggingFace'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'Your models, your data, your hardware. Everything stays local'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Developer Friendly',
      description: 'OpenAI-compatible API, Python SDK, and comprehensive docs'
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Smart Training',
      description: 'Nexara DSL for AI-native model configuration and fine-tuning'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Browser Deploy',
      description: 'Deploy models to websites with CDN loading. No servers needed'
    },
  ]

  const stats = [
    { number: '28+', label: 'Models Supported' },
    { number: '38', label: 'CLI Commands' },
    { number: '75%', label: 'Production Ready' },
    { number: '12KB', label: 'Web Deploy Size' },
  ]

  return (
    <div className="animated-bg">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-4 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                v0.2.0 - Now with Browser Deployment
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Faster Local
              <span className="gradient-text"> LLMs</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
              Forge models. Train them. Run them locally.
              <br />
              No cloud dependencies. Complete privacy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/download" className="btn-primary text-lg px-8 py-4">
                Get Started
                <span className="ml-2">→</span>
              </Link>
              <a
                href="https://hyperneural.cfd/docs"
                className="btn-secondary text-lg px-8 py-4"
              >
                View Documentation
              </a>
            </div>

            <div className="mt-16 card max-w-2xl mx-auto text-left">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Terminal className="w-4 h-4" />
                <span className="text-sm">Quick Start</span>
              </div>
              <pre className="font-mono text-sm overflow-x-auto">
                <code className="text-accent">$ forge pull qwen2.5-coder:7b</code>
                <br />
                <code className="text-accent">$ forge train</code>
                <br />
                <code className="text-accent">$ forge chat</code>
                <br />
                <code className="text-gray-500"># InferForge beta is ready</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400">
              Production-ready features for modern AI development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card group hover:glow cursor-pointer">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="card glow bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Install InferForge and start building AI-powered applications in minutes
            </p>
            <Link to="/download" className="btn-primary text-lg px-8 py-4 inline-block">
              Download Now →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
