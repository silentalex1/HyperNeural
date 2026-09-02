import { useMemo, useState } from 'react'

const models = [
  'dolphin-mixtral:8x7b',
  'prysmis:latest',
  'gemma2:9b',
  'llama3.1:8b',
  'gemini-3-flash-preview:latest',
  'oroboroslabs/claude-fable-5Q:latest',
  'glm-5.2:cloud',
  'qwen2.5vl:7b',
  'prysmisai-v3:latest',
  'embeddinggemma:latest',
  'prysmisai-v2:latest',
  'prysmisai-ft:latest',
  'qwen2.5-coder:7b',
  'prysmisai-fast:latest',
  'prysmisai:latest',
  'qwen2.5-coder:14b',
  'prysmaisai:latest'
]

export default function Models() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return models
    return models.filter(name => name.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="relative overflow-x-hidden page-fade-in">
      <div className="fixed inset-0 z-[-1] bg-grid-pattern bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Explore AI Models</h1>
          <p className="text-gray-500">Search the catalog and pull any model straight into your InferForge runtime.</p>
        </div>

        <div className="max-w-3xl mx-auto mb-14">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search models..."
                className="search-input w-full text-white placeholder-gray-500 text-sm rounded-xl py-3.5 pl-11 pr-4 border border-white/[0.08] focus:border-accent focus:outline-none transition-all"
              />
            </div>
            <button className="w-full sm:w-auto bg-accent hover:bg-accentHover text-white text-sm font-medium px-5 py-3.5 rounded-xl transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(79,124,255,0.2)]">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add your model
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3 px-1">You can pull more models too — see forge pull in the docs.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {filtered.map(name => (
            <div key={name} className="model-card bg-[#0a0a0d] hover:bg-[#0e0e13] p-5 rounded-2xl border border-white/[0.05] hover:border-accent/30">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className={`font-semibold text-[15px] text-white tracking-tight ${name.includes('/') ? 'break-all' : ''}`}>{name}</h3>
                <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-green-400/80" />
              </div>
              <code className="block bg-black/50 p-3 rounded-xl font-mono text-xs text-gray-400 selection:bg-accent">
                forge pull {name}
              </code>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-600 py-14 text-sm">
            No models found matching your search.
          </div>
        )}
      </main>
    </div>
  )
}
