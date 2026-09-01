import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Boxes, Key, User, CreditCard, HelpCircle, Layers, Sparkles, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UserDashboard() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const [embeddings, setEmbeddings] = useState<Array<{ name: string; link: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(`inferforge-embeddings:${username}`) || '[]') } catch { return [] }
  })
  const [newModel, setNewModel] = useState('')
  const createEmbedding = () => {
    if (!newModel.trim() || !username) return
    const safe = newModel.trim().replace(/[:/]+/g, '-')
    const link = `https://hyperneural.cfd/${safe}/#@${username}`
    const next = [...embeddings, { name: safe, link }]
    setEmbeddings(next)
    localStorage.setItem(`inferforge-embeddings:${username}`, JSON.stringify(next))
    setNewModel('')
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'embeddings', label: 'Embeddings', icon: Sparkles },
    { id: 'models', label: 'Models', icon: Boxes },
    { id: 'api', label: 'API', icon: Key },
    { id: 'account', label: 'Account', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0A0B] flex">
      <aside className="w-60 shrink-0 border-r border-white/[0.06] p-4 hidden md:block bg-white/[0.01]">
        <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">{username?.[0]?.toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{username}</p>
            <p className="text-xs text-white/40 truncate">Personal dashboard</p>
          </div>
        </div>
        <nav className="space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition ${active === s.id ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}>
              <s.icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {active === 'overview' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <p className="text-sm text-white/40 -mt-4">Welcome back, {username} · Here's what's happening.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5"><p className="text-xs text-white/40">Models</p><p className="text-3xl font-bold text-white mt-2">{embeddings.length}</p><p className="text-xs text-emerald-400 mt-1">● Active</p></div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5"><p className="text-xs text-white/40">Embeddings</p><p className="text-3xl font-bold text-white mt-2">{embeddings.length}</p><p className="text-xs text-white/30 mt-1">Total created</p></div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5"><p className="text-xs text-white/40">API calls</p><p className="text-3xl font-bold text-white mt-2">0</p><p className="text-xs text-white/30 mt-1">This month</p></div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">Quick actions</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActive('embeddings')} className="btn-primary text-sm">Create embedding</button>
                <Link to="/our-models" className="btn-secondary text-sm">Browse models</Link>
                <Link to="/chatui" className="btn-secondary text-sm">Open chat</Link>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">Recent activity</h3>
              <p className="text-sm text-white/50">{embeddings.length ? `${embeddings.length} embedding(s) created.` : 'No activity yet.'}</p>
            </div>
          </div>
        )}
        {active === 'embeddings' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Embeddings</h1>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">✦</span> Create new embeddings</h3>
              <div className="flex gap-2">
                <input value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="model name, e.g. my-model" className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition" />
                <button onClick={createEmbedding} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition whitespace-nowrap shadow-lg shadow-emerald-500/20">Generate SDK</button>
              </div>
              <p className="text-xs text-white/30 mt-3 font-mono">→ https://hyperneural.cfd/&lt;model&gt;/#@{username}</p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">View / manage existing embeddings</h3>
              {embeddings.length === 0 ? <p className="text-sm text-white/50">No embeddings yet.</p> : (
                <div className="space-y-2">
                  {embeddings.map(e => (
                    <div key={e.link} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div><p className="text-sm text-white font-medium">{e.name}</p><a href={e.link} target="_blank" rel="noopener" className="text-xs text-emerald-400 hover:underline font-mono">{e.link}</a></div>
                      <button onClick={() => { const next = embeddings.filter(x => x.link !== e.link); setEmbeddings(next); localStorage.setItem(`inferforge-embeddings:${username}`, JSON.stringify(next)) }} className="text-xs text-red-400">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">Download SDK code</h3>
              <pre className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-xs font-mono text-white/70 overflow-x-auto">{`// HyperNeural SDK — ${username}\nfetch('https://hyperneural.cfd/${embeddings[0]?.name || 'your-model'}/#@${username}')\n  .then(r => r.text()).then(console.log)`}</pre>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">Embedding analytics</h3>
              <p className="text-sm text-white/50">{embeddings.length} embedding(s) · 0 API calls today</p>
            </div>
          </div>
        )}
        {active === 'models' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Models</h1>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Your trained models</h3><p className="text-sm text-white/50">{embeddings.length ? embeddings.map(e => e.name).join(', ') : 'No models yet.'}</p></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Model performance metrics</h3><p className="text-sm text-white/50">Latency avg: — · Throughput: —</p></div>
            <div className="card p-5 flex gap-2"><button className="btn-secondary text-sm">Download models</button><button className="btn-secondary text-sm">Delete / manage models</button></div>
          </div>
        )}
        {active === 'api' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">API</h1>
            <div className="card p-5"><h3 className="font-semibold text-white mb-2">Generate API keys</h3><button onClick={() => navigator.clipboard.writeText(`hn_${Math.random().toString(36).slice(2,12)}`)} className="btn-primary text-sm">Generate key</button></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-2">View API usage</h3><p className="text-sm text-white/50">0 requests this month</p></div>
            <div className="card p-5"><a href="/docs" className="text-emerald-400 text-sm flex items-center gap-1">API documentation <ExternalLink className="w-3 h-3" /></a></div>
          </div>
        )}
        {active === 'account' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Account</h1>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Profile settings</h3><p className="text-sm text-white/50">Username: {username}</p>{user && <p className="text-sm text-white/50">Email: {user.email}</p>}</div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Change password</h3><p className="text-sm text-white/50">Use the account settings on the auth server.</p></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Connected devices</h3><p className="text-sm text-white/50">This device — {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 48) : 'unknown'}</p></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Account settings</h3><p className="text-sm text-white/50">Manage your InferForge account.</p></div>
          </div>
        )}
        {active === 'billing' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Usage history</h3><p className="text-sm text-white/50">No charges yet.</p></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Payment methods</h3><p className="text-sm text-white/50">No payment method on file.</p></div>
            <div className="card p-5"><h3 className="font-semibold text-white mb-1">Invoices</h3><p className="text-sm text-white/50">No invoices.</p></div>
          </div>
        )}
        {active === 'help' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Help</h1>
            <div className="card p-5 space-y-2">
              <a href="/docs" className="block text-emerald-400 text-sm">Link to docs</a>
              <a href="https://discord.gg/inferforge" target="_blank" rel="noopener" className="block text-emerald-400 text-sm">Link to Discord</a>
              <a href="/feedback" className="block text-emerald-400 text-sm">Support tickets</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
