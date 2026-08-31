export async function onRequest(context: any) {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" }
  if (context.request.method === "OPTIONS") return new Response(null, { headers: cors })
  if (context.request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors })
  try {
    const body = await context.request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const code = String(body.code || "").trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ error: "Valid email required" }), { status: 400, headers: cors })
    const finalCode = code || String(Math.floor(100000 + Math.random() * 900000))
    const cfUrl = (context.env && context.env.CLOUDFLARE_EMAIL_WORKER_URL) || "https://inferforge-email.asdwwas233.workers.dev"
    try { await fetch(cfUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: finalCode }) }) } catch {}
    return new Response(JSON.stringify({ ok: true }), { headers: cors })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Invalid request" }), { status: 400, headers: cors })
  }
}
