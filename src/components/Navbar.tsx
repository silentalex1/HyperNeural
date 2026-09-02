import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-blue-950/80 border-b border-blue-900/60">
      <div className="max-w-site mx-auto px-6 lg:px-8 h-[64px] flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[11px] font-extrabold tracking-tighter text-black">IF</span>
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">InferForge</span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-400/15 text-amber-300 border border-amber-400/20">v0.2.0-beta.1</span>
        </Link>
      </div>
    </nav>
  )
}
