import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-black py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-[#8daaff] flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-white">InferForge</span>
        </Link>

        <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link to="/doc" className="hover:text-white transition-colors">Documentation</Link>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
            Discord
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
        </div>

        <span className="text-sm text-gray-600">&copy; 2026 InferForge</span>
      </div>
    </footer>
  )
}
