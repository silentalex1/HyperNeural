import { Terminal, MessageCircle } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-dark/50 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">InferForge</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Faster local LLMs. Forge models, train them, and run them locally. 
              No cloud dependencies, complete privacy.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/download" className="hover:text-white transition-colors">Download</a></li>
              <li><a href="/models" className="hover:text-white transition-colors">Models</a></li>
              <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="https://hyperneural.cfd/api" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <a
              href="https://discord.gg/inferforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 p-3 hover:bg-white/10 rounded-lg transition-colors text-sm"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Join Discord</span>
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {currentYear} InferForge. All rights reserved.</p>
          <p>Built for developers who value privacy</p>
        </div>
      </div>
    </footer>
  )
}
