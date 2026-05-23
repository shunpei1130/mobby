export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res.status(200).json({
    ok: true,
    service: "line-ai-mobby",
    provider: "mock",
    time: new Date().toISOString()
  });
}
