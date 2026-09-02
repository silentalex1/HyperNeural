export default async (req) => {
  if (req.method !== "POST") {
    return new Response('{"ok":false}', { status: 405, headers: { "Content-Type": "application/json" } });
  }
  let payload = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const email = String(payload.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response('{"ok":false}', { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const letter = "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const extra = ["$%", "$#", "!%", "#$"][Math.floor(Math.random() * 4)];
  const code = `forge-${letter}${digits}${extra}`;
  const origin = new URL(req.url).origin;
  await fetch(`${origin}/__forms.html`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      "form-name": "verify-code",
      email,
      code,
      subject: `Your InferForge code is ${code}`
    }).toString()
  }).catch(() => {});
  return new Response('{"ok":true}', { status: 200, headers: { "Content-Type": "application/json" } });
};

export const config = {
  path: "/api/register/send-code",
  method: "POST"
};
