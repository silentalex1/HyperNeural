import { Link } from 'react-router-dom'

interface FooterProps {
  variant?: 'home' | 'sub'
}

export default function Footer({ variant = 'home' }: FooterProps) {
  if (variant === 'sub') {
    return (
      <footer className="border-t border-white/[0.04] bg-black py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <Link to="/" className="font-bold text-white text-base">InferForge</Link>
          <span>&copy; 2026 InferForge</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-white/[0.05] bg-black py-16 mt-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <Link to="/" className="font-bold tracking-tight text-white text-xl drop-shadow-sm">InferForge</Link>

        <div className="flex items-center gap-10 text-sm font-medium text-gray-400">
          <Link to="/doc" className="hover:text-white transition-colors">Documentation</Link>
          <a href="#" className="hover:text-white transition-colors">Discord Server</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>

        <div className="text-sm text-gray-600 flex items-center gap-6">
          <a href="#" className="hover:text-gray-400 transition-colors">License</a>
          <span>&copy; 2026 InferForge</span>
        </div>
      </div>
    </footer>
  )
}
