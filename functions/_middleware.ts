export async function onRequest(context: any) {
  const url = new URL(context.request.url)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/assets/") || url.pathname.includes(".")) {
    return context.next()
  }
  const res = await context.next()
  if (res.status !== 404) return res
  const asset = await context.env.ASSETS.fetch(new Request(new URL("/index.html", url).toString()))
  return new Response(asset.body, { status: 200, headers: asset.headers })
}
