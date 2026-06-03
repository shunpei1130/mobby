export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  const defaultModel = provider === "gemini"
    ? "gemini-2.5-flash-lite"
    : provider === "ollama"
      ? "qwen3.5:9b"
      : "";
  const model = String(process.env.AI_MODEL || defaultModel).trim();
  const ollamaBaseUrl = String(process.env.OLLAMA_BASE_URL || (provider === "ollama" ? "http://127.0.0.1:11434" : "")).trim();
  const personalResultLinkingEnabled = String(process.env.LINE_AI_PERSONAL_RESULT_LINKING || "").toLowerCase() === "true";
  const liffRuntimeConfigured = Boolean(
    process.env.LIFF_ID &&
    process.env.LINE_LOGIN_CHANNEL_ID &&
    process.env.LINE_LOGIN_CHANNEL_SECRET &&
    process.env.LINE_ADD_URL &&
    process.env.MOBBY_LINE_AI_SECRET
  );
  const storageReady = process.env.VERCEL_ENV === "production" ? Boolean(process.env.BLOB_READ_WRITE_TOKEN) : true;
  const liffLinkingReady = personalResultLinkingEnabled && liffRuntimeConfigured && storageReady;

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res.status(200).json({
    ok: true,
    service: "line-ai-mobby",
    provider,
    model,
    ollama: {
      baseUrl: provider === "ollama" ? ollamaBaseUrl : "",
      configured: provider === "ollama" ? Boolean(ollamaBaseUrl) : false
    },
    features: {
      diagnosisKnowledge: true,
      mobbyKnowledge: true,
      aiGeneratedKnowledgeReplies: true,
      personalResultReference: true,
      personalResultLinking: liffLinkingReady,
      compatibilityReply: true,
      liffLinking: liffLinkingReady
    },
    configured: {
      lineAddUrl: Boolean(process.env.LINE_ADD_URL),
      lineChannelSecret: Boolean(process.env.LINE_CHANNEL_SECRET),
      lineChannelAccessToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      mobbyLineAiSecret: Boolean(process.env.MOBBY_LINE_AI_SECRET),
      geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      ollamaBaseUrl: Boolean(ollamaBaseUrl),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      liffId: Boolean(process.env.LIFF_ID),
      lineLoginChannelId: Boolean(process.env.LINE_LOGIN_CHANNEL_ID),
      lineLoginChannelSecret: Boolean(process.env.LINE_LOGIN_CHANNEL_SECRET),
      personalResultLinkingFlag: personalResultLinkingEnabled
    },
    time: new Date().toISOString()
  });
}
