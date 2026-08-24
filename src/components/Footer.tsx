import { Terminal, MessageCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-dark/60 backdrop-blur-xl mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">InferForge</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Forge models, train them on your own hardware, and run them entirely
              locally. No cloud dependencies. Complete privacy.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/download" className="text-gray-400 hover:text-white transition-colors">Download</Link></li>
              <li><Link to="/models" className="text-gray-400 hover:text-white transition-colors">Models</Link></li>
              <li><Link to="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><a href="https://hyperneural.cfd/api" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Community</h3>
            <a
              href="https://discord.gg/inferforge"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/40 hover:bg-white/[0.07] transition-all duration-200 max-w-xs"
            >
              <span className="flex items-center gap-3">
                <span className="p-2 bg-indigo-500/20 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-indigo-400" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">Join Discord</span>
                  <span className="block text-xs text-gray-400">Get help and share projects</span>
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>&copy; {currentYear} InferForge. All rights reserved.</p>
          <p>Built for developers who value privacy and performance.</p>
        </div>
      </div>
    </footer>
  )
}
