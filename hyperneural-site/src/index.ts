export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url)
    let path = url.pathname

    if (path === "/" || path === "") path = "/index.html"

    if (path !== "/" && !path.includes(".") && path.split("/").filter(Boolean).length === 1) {
      const sdk = await env.ASSETS.fetch(new URL("/sdk.html", url.origin))
      if (sdk.status !== 404) {
        const headers = new Headers(sdk.headers)
        headers.set("Access-Control-Allow-Origin", "*")
        return new Response(sdk.body, { status: 200, headers })
      }
    }

    const asset = await env.ASSETS.fetch(new URL(path, url.origin))
    if (asset.status !== 404) {
      const headers = new Headers(asset.headers)
      headers.set("Access-Control-Allow-Origin", "*")
      return new Response(asset.body, { status: asset.status, headers })
    }

    return new Response("Not Found", { status: 404 })
  },
}
