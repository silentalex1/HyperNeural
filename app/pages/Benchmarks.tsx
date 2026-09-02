import { useMemo, useState } from 'react'

interface BenchModel {
  name: string
  displayName: string
  family: string
  tokensPerSec: number
  latencyMs: number
  quality: number
  memoryGb: number
  contextK: number
  accent: string
  embedded?: boolean
}

const models: BenchModel[] = [
  { name: 'inferforge-beta', displayName: 'InferForge Beta', family: 'Forge', tokensPerSec: 84, latencyMs: 118, quality: 91, memoryGb: 4.4, contextK: 32, accent: '#4f7cff', embedded: true },
  { name: 'prysmisai-fast:latest', displayName: 'PrysmisAI Fast', family: 'Prysmis', tokensPerSec: 132, latencyMs: 62, quality: 78, memoryGb: 3.6, contextK: 16, accent: '#22c55e', embedded: true },
  { name: 'glm-5.2:cloud', displayName: 'GLM 5.2 Cloud', family: 'GLM', tokensPerSec: 96, latencyMs: 210, quality: 94, memoryGb: 0, contextK: 128, accent: '#a78bfa', embedded: true },
  { name: 'qwen2.5-coder:7b', displayName: 'Qwen 2.5 Coder 7B', family: 'Qwen', tokensPerSec: 91, latencyMs: 104, quality: 86, memoryGb: 4.7, contextK: 32, accent: '#f59e0b' },
  { name: 'qwen2.5-coder:14b', displayName: 'Qwen 2.5 Coder 14B', family: 'Qwen', tokensPerSec: 52, latencyMs: 186, quality: 90, memoryGb: 8.9, contextK: 32, accent: '#f97316' },
  { name: 'llama3.1:8b', displayName: 'Llama 3.1 8B', family: 'Meta', tokensPerSec: 88, latencyMs: 112, quality: 84, memoryGb: 4.9, contextK: 128, accent: '#60a5fa' },
  { name: 'gemma2:9b', displayName: 'Gemma 2 9B', family: 'Google', tokensPerSec: 76, latencyMs: 128, quality: 82, memoryGb: 5.4, contextK: 8, accent: '#f472b6' },
]

type Metric = 'tokensPerSec' | 'latencyMs' | 'quality'

const metricMeta: Record<Metric, { label: string; unit: string; higherBetter: boolean }> = {
  tokensPerSec: { label: 'Speed', unit: 'tok/s', higherBetter: true },
  latencyMs: { label: 'Latency', unit: 'ms', higherBetter: false },
  quality: { label: 'Quality', unit: '/100', higherBetter: true },
}

export default function Benchmarks() {
  const [selected, setSelected] = useState<string[]>(['inferforge-beta', 'prysmisai-fast:latest', 'glm-5.2:cloud'])
  const [metric, setMetric] = useState<Metric>('tokensPerSec')

  const toggle = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  const compared = useMemo(
    () => models.filter(m => selected.includes(m.name)),
    [selected]
  )

  const sorted = useMemo(() => {
    const dir = metricMeta[metric].higherBetter ? -1 : 1
    return [...compared].sort((a, b) => dir * (a[metric] - b[metric]))
  }, [compared, metric])

  const maxVal = useMemo(() => {
    if (sorted.length === 0) return 1
    return Math.max(...sorted.map(m => m[metric]))
  }, [sorted, metric])

  const winner = sorted[0]

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 page-fade-in relative">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-[0.025] pointer-events-none" />

      <header className="mb-12 relative">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Benchmarks</h1>
        <p className="text-gray-500 max-w-2xl">
          Compare every model in the InferForge registry — speed, latency, output quality, and memory footprint.
          Run it yourself with <code className="font-mono text-sm text-gray-300">forge benchmark compare &lt;models...&gt;</code>
        </p>
      </header>

      <section className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">Models to compare</p>
        <div className="flex flex-wrap gap-2.5">
          {models.map(m => {
            const active = selected.includes(m.name)
            return (
              <button
                key={m.name}
                onClick={() => toggle(m.name)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  active
                    ? 'text-white border-transparent shadow-lg'
                    : 'text-gray-500 border-white/[0.08] hover:text-gray-300 hover:border-white/20 bg-white/[0.02]'
                }`}
                style={active ? { backgroundColor: `${m.accent}26`, borderColor: `${m.accent}66`, boxShadow: `0 0 18px ${m.accent}22` } : undefined}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? m.accent : '#374151' }} />
                  {m.displayName}
                  {m.embedded && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent">embedded</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {compared.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm border border-white/[0.06] rounded-2xl bg-white/[0.015]">
          Select at least one model to see results.
        </div>
      ) : (
        <>
          {winner && (
            <section className="mb-10 rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5" style={{ borderColor: `${winner.accent}40`, background: `linear-gradient(135deg, ${winner.accent}0f, transparent 60%)` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${winner.accent}1f`, color: winner.accent }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Fastest overall right now</p>
                <p className="text-lg font-bold text-white">
                  {winner.displayName}
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    {winner.tokensPerSec} tok/s · {winner.latencyMs} ms first token · quality {winner.quality}/100
                  </span>
                </p>
              </div>
            </section>
          )}

          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">Results</p>
              <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                {(Object.keys(metricMeta) as Metric[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setMetric(k)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      metric === k ? 'bg-accent text-white shadow-[0_0_14px_rgba(79,124,255,0.3)]' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {metricMeta[k].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {sorted.map((m, i) => {
                const val = m[metric]
                const pct = Math.max(4, (val / maxVal) * 100)
                return (
                  <div key={m.name} className="flex items-center gap-4">
                    <span className="w-6 text-xs font-mono text-gray-600 text-right shrink-0">{i + 1}</span>
                    <span className="w-44 text-sm text-gray-300 truncate shrink-0 hidden sm:block">{m.displayName}</span>
                    <div className="flex-1 h-9 bg-white/[0.03] border border-white/[0.05] rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${m.accent}cc, ${m.accent}55)`,
                        }}
                      />
                      <span className="absolute inset-y-0 left-3 flex items-center text-xs font-mono font-semibold text-white/90">
                        {val} {metricMeta[metric].unit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">Full comparison</p>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['Model', 'Speed', 'Latency', 'Quality', 'Memory', 'Context'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(m => (
                    <tr key={m.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.accent }} />
                          <span className="text-gray-200 font-medium whitespace-nowrap">{m.displayName}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400">{m.tokensPerSec} tok/s</td>
                      <td className="px-5 py-4 font-mono text-gray-400">{m.latencyMs} ms</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-14 h-1.5 rounded-full bg-white/[0.06] overflow-hidden inline-block">
                            <span className="block h-full rounded-full" style={{ width: `${m.quality}%`, backgroundColor: m.accent }} />
                          </span>
                          <span className="font-mono text-gray-400">{m.quality}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400">{m.memoryGb > 0 ? `${m.memoryGb} GB` : 'cloud'}</td>
                      <td className="px-5 py-4 font-mono text-gray-400">{m.contextK}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
