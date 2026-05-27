import { buildSystemPrompt } from "./_prompts.js";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_REPLY_CHARS = 260;

function compact(text, max = 48) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function clampReply(text) {
  const value = String(text || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!value) return "";
  return value.length > MAX_REPLY_CHARS ? `${value.slice(0, MAX_REPLY_CHARS - 1)}…` : value;
}

function historyToContents(history, message) {
  const recent = Array.isArray(history) ? history.slice(-12) : [];
  const contents = recent
    .filter((item) => item?.role === "user" || item?.role === "assistant")
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.text || "").slice(0, 500) }]
    }))
    .filter((item) => item.parts[0].text);

  contents.push({
    role: "user",
    parts: [{ text: String(message || "").slice(0, 500) }]
  });
  return contents;
}

function loveGuardrail(message, user) {
  if (/追いLINE|監視|既読|位置|SNS|不安|依存|束縛/.test(message)) {
    return `それ、気になり始めると頭の中で通知音が鳴り続けるやつだよね。「${user?.resultName || "あなたの結果"}」のモビー的には、今は追い確認より一回スマホ置こ。送るなら責めない一言だけ。`;
  }
  return "";
}

export async function generateReply({ user, message, history }) {
  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "gemini") {
    try {
      return await generateGeminiReply({ user, message, history });
    } catch (error) {
      console.error("[LINE AI] Gemini reply failed. Falling back to mock.", {
        message: error?.message,
        status: error?.status
      });
      return generateMockReply({ user, message });
    }
  }
  if (provider !== "mock") {
    console.warn("[LINE AI] Unknown provider. Falling back to mock.", { provider });
  }
  return generateMockReply({ user, message });
}

export async function generateGeminiReply({ user, message, history }) {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = String(process.env.AI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
  const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(user) }]
      },
      contents: historyToContents(history, message),
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 180,
        responseMimeType: "text/plain"
      }
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Gemini API returned ${response.status}`);
    error.status = response.status;
    error.body = body.slice(0, 300);
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini API returned an empty reply");
  }
  return clampReply(text);
}

export function generateMockReply({ user, message }) {
  const resultName = user?.resultName || "あなたの結果";
  const userMessage = compact(message);

  if (user?.source === "16love") {
    const guarded = loveGuardrail(String(message || ""), user);
    if (guarded) return guarded;
  }

  if (user?.source === "16school") {
    return `「${userMessage}」ね。さらっと言ってるけど、ちょっと引っかかってるやつかも。「${resultName}」のモビー的には、まずどの場面が一番モヤったか聞きたい。`;
  }
  if (user?.source === "16stan") {
    return `「${userMessage}」かあ。好きが強いほど心も忙しくなるよね。「${resultName}」のモビー的には、今は嬉しい寄り？それとも疲れ寄り？`;
  }
  if (user?.source === "16renai") {
    return `「${userMessage}」って、短いけどけっこう気持ち乗ってそう。「${resultName}」のモビー的には、急いで結論出さなくていいやつ。まず何が一番気になってる？`;
  }

  return `「${userMessage}」ね。そこ気になるの、わりと自然だと思う。「${resultName}」のモビー的には、まず今の気持ちをもうちょい聞かせてほしい。`;
}
