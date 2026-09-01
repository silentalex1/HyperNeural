export async function onRequest(context: any) {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  if (context.request.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })
  if (context.request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors })
  return new Response(
    JSON.stringify({
      error: "local-server-offline",
      message: "Could not reach your local InferForge server. Run 'forge serve' in your terminal, make sure your account is connected with 'forge connect', then chat again — the web UI will connect to it automatically.",
    }),
    { status: 502, headers: cors }
  )
}
