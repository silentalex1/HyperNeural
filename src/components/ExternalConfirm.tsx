import { X, ExternalLink } from 'lucide-react'

export default function ExternalConfirm({ open, href, onClose, onConfirm }: { open: boolean; href: string; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#141418] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/[0.06] text-white/40 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/15 flex items-center justify-center mb-4">
          <ExternalLink className="w-5 h-5 text-[#FF7A00]" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1.5">You are leaving InferForge</h3>
        <p className="text-sm leading-6 text-white/55 mb-2">
          You are about to open an external site:
        </p>
        <p className="text-sm font-mono px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/80 break-all mb-5">
          {href}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition">
            Stay here
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF7A00] text-sm font-bold text-white hover:bg-[#ff8c1a] transition">
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
