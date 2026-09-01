export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  ADMIN_KV: KVNamespace
  ADMIN_USER: string
  ADMIN_PASSWORD: string
  ADMIN_CODE: string
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS" },
  })

async function requireAuth(request: Request, env: Env): Promise<boolean> {
  const auth = request.headers.get("Authorization") || ""
  const token = auth.replace("Bearer ", "")
  if (!token) return false
  const valid = await env.ADMIN_KV.get(`token:${token}`)
  return valid === "1"
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, "")

    if (request.method === "OPTIONS") return json({ ok: true })

    if (!path.startsWith("/admin-panel/api")) {
      const innerPath = url.pathname.replace(/^\/admin-panel/, "") || "/"
      const assetUrl = new URL(innerPath === "/" ? "/index.html" : innerPath, url.origin)
      let asset = await env.ASSETS.fetch(assetUrl)
      if (asset.status === 404) {
        asset = await env.ASSETS.fetch(new URL("/index.html", url.origin).toString())
      }
      return new Response(asset.body, { status: 200, headers: asset.headers })
    }

    if (path === "/admin-panel/api/admin-setup" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as Record<string, string>
      const username = String(body.username || "").trim()
      const password = String(body.password || "")
      if (!username || !password) return json({ error: "username and password required" }, 400)
      await env.ADMIN_KV.put("admin:account", JSON.stringify({ username, password }))
      return json({ ok: true, username })
    }

    if (path === "/admin-panel/api/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as Record<string, string>
      let user = env.ADMIN_USER || "admin"
      let pass = env.ADMIN_PASSWORD || "forge-admin-2026"
      const stored = await env.ADMIN_KV.get("admin:account")
      if (stored) {
        const acct = JSON.parse(stored) as { username: string; password: string }
        user = acct.username
        pass = acct.password
      }
      if (body.username !== user || body.password !== pass) {
        return json({ error: "Invalid admin credentials." }, 403)
      }
      const token = crypto.randomUUID()
      await env.ADMIN_KV.put(`token:${token}`, "1", { expirationTtl: 3600 * 8 })
      return json({ ok: true, token, user: { id: "1", username: user, email: `${user}@hyperneural.cfd`, role: "super_admin" } })
    }

    if (path === "/admin-panel/api/reports" && request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      if (!body.message) return json({ error: "message required" }, 400)
      const id = body.id || crypto.randomUUID().slice(0, 8)
      const report = { ...body, id, received: new Date().toISOString(), status: body.status || "open" }
      await env.ADMIN_KV.put(`report:${id}`, JSON.stringify(report))
      const index = await env.ADMIN_KV.get("report:index")
      const ids: string[] = index ? JSON.parse(index) : []
      ids.unshift(id)
      await env.ADMIN_KV.put("report:index", JSON.stringify(ids.slice(0, 500)))
      return json({ ok: true, id })
    }

    if (path === "/admin-panel/api/updates" && request.method === "POST") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401)
      const body = await request.json().catch(() => ({})) as Record<string, string>
      const version = String(body.version || "").trim()
      const notes = String(body.notes || "").trim()
      if (!version) return json({ error: "version required" }, 400)
      const update = { version, notes, pushedAt: new Date().toISOString() }
      await env.ADMIN_KV.put("update:latest", JSON.stringify(update))
      const idx = await env.ADMIN_KV.get("updates:index")
      const list: unknown[] = idx ? JSON.parse(idx) : []
      list.unshift(update)
      await env.ADMIN_KV.put("updates:index", JSON.stringify(list.slice(0, 100)))
      return json({ ok: true, update })
    }

    if (path === "/admin-panel/api/updates" && request.method === "GET") {
      const idx = await env.ADMIN_KV.get("updates:index")
      const updates: unknown[] = idx ? JSON.parse(idx) : []
      return json({ updates })
    }

    if (path === "/api/updates/latest" && request.method === "GET") {
      const raw = await env.ADMIN_KV.get("update:latest")
      const latest = raw ? JSON.parse(raw) : null
      return json({ update: latest })
    }

    if (path === "/admin-panel/api/stats" && request.method === "GET") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401)
      const index = await env.ADMIN_KV.get("report:index")
      const ids: string[] = index ? JSON.parse(index) : []
      const reports = (await Promise.all(ids.map(async (id) => {
        const raw = await env.ADMIN_KV.get(`report:${id}`)
        return raw ? JSON.parse(raw) : null
      }))).filter(Boolean) as Array<{ status?: string; type?: string; received?: string }>
      const byStatus = { open: 0, investigating: 0, resolved: 0 }
      const byType: Record<string, number> = {}
      for (const r of reports) {
        const st = (r.status || "open").toLowerCase()
        if (st in byStatus) byStatus[st as keyof typeof byStatus]++
        const ty = r.type || "feedback"
        byType[ty] = (byType[ty] || 0) + 1
      }
      let users = 0
      try {
        const ur = await fetch("https://inferforge-email.asdwwas233.workers.dev/api/auth/users-count")
        if (ur.ok) users = ((await ur.json()) as { count?: number }).count || 0
      } catch { /* ignore */ }
      return json({
        reports: { total: reports.length, ...byStatus, byType },
        users,
        lastReportAt: reports[0]?.received || null,
      })
    }

    if (path === "/admin-panel/api/reports" && request.method === "GET") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401)
      const index = await env.ADMIN_KV.get("report:index")
      const ids: string[] = index ? JSON.parse(index) : []
      const reports = await Promise.all(ids.map(async (id) => {
        const raw = await env.ADMIN_KV.get(`report:${id}`)
        return raw ? JSON.parse(raw) : null
      }))
      return json({ reports: reports.filter(Boolean) })
    }

    if (path.startsWith("/admin-panel/api/reports/") && request.method === "PATCH") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401)
      const id = path.split("/").pop()!
      const raw = await env.ADMIN_KV.get(`report:${id}`)
      if (!raw) return json({ error: "not found" }, 404)
      const report = JSON.parse(raw)
      const body = await request.json().catch(() => ({}))
      const updated = { ...report, ...body }
      await env.ADMIN_KV.put(`report:${id}`, JSON.stringify(updated))
      return json({ ok: true, report: updated })
    }

    if (path.startsWith("/admin-panel/api/reports/") && request.method === "DELETE") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401)
      const id = path.split("/").pop()!
      await env.ADMIN_KV.delete(`report:${id}`)
      const index = await env.ADMIN_KV.get("report:index")
      const ids: string[] = index ? JSON.parse(index) : []
      await env.ADMIN_KV.put("report:index", JSON.stringify(ids.filter(i => i !== id)))
      return json({ ok: true })
    }

    return json({ error: "Not Found" }, 404)
  },
}