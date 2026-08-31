import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/[0.06] bg-[#08080A]">
      <div className="max-w-site mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-[10px] font-extrabold tracking-tighter text-black">IF</span>
            </span>
            <span className="text-sm font-bold tracking-tight text-white">InferForge</span>
            <span className="text-xs text-white/30 ml-1">© {year}</span>
          </Link>
          <nav className="flex items-center gap-6 text-[13px] font-medium text-white/40">
            <Link to="/#comparison" className="hover:text-white/80 transition">FAQ</Link>
            <Link to="/docs" className="hover:text-white/80 transition">Documentation</Link>
            <a href="https://github.com/silentalex1/HyperNeural" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition">GitHub</a>
            <a href="https://discord.gg/Nc9fqvRM68" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition">Discord</a>
            <a href="mailto:hello@inferforge.dev" className="hover:text-white/80 transition">Support</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
