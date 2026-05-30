function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const fallbackLineAddUrl = String(process.env.LINE_ADD_URL || "").trim();
  if (!fallbackLineAddUrl) {
    return res.status(500).json({ ok: false, error: "LINE_ADD_URL is not configured" });
  }

  return res.status(200).json({
    ok: true,
    lineAddUrl: fallbackLineAddUrl,
    firstMessageText: "モビーだよ！なんでも話してね！"
  });
}
