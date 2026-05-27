export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  const model = String(process.env.AI_MODEL || (provider === "gemini" ? "gemini-2.5-flash-lite" : "")).trim();

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res.status(200).json({
    ok: true,
    service: "line-ai-mobby",
    provider,
    model,
    configured: {
      lineAddUrl: Boolean(process.env.LINE_ADD_URL),
      lineChannelSecret: Boolean(process.env.LINE_CHANNEL_SECRET),
      lineChannelAccessToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      mobbyLineAiSecret: Boolean(process.env.MOBBY_LINE_AI_SECRET),
      geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    },
    time: new Date().toISOString()
  });
}
