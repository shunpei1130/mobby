import { buildSystemPrompt } from "./_prompts.js";
import { buildCompatibilityReply } from "./_compatibility.js";
import { buildKnowledgeReply, isOwnResultQuestion } from "./_diagnosis-knowledge.js";
import { buildMobbyKnowledgeReply } from "./_mobby-knowledge.js";

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

function loveGuardrail(message) {
  if (/追いLINE|監視|既読|位置|SNS|不安|依存|束縛/.test(message)) {
    return "それ、気になり始めると頭の中で通知音が鳴り続けるやつだよね。今は追い確認より一回スマホ置こ📱 送るなら責めない一言だけにしよ。";
  }
  return "";
}

export async function generateReply({ user, message, history }) {
  if (isOwnResultQuestion(message)) {
    const ownResultReply = buildKnowledgeReply({ user, message });
    if (ownResultReply) return ownResultReply;
  }

  const compatibilityReply = buildCompatibilityReply({ user, message });
  if (compatibilityReply) return compatibilityReply;

  const mobbyKnowledgeReply = buildMobbyKnowledgeReply({ user, message });
  if (mobbyKnowledgeReply) return mobbyKnowledgeReply;

  const knowledgeReply = buildKnowledgeReply({ user, message });
  if (knowledgeReply) return knowledgeReply;

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
        parts: [{ text: buildSystemPrompt(user, message) }]
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
  const userMessage = compact(message);
  const quotedMessage = userMessage ? `「${userMessage}」ね。` : "";

  const guarded = loveGuardrail(String(message || ""));
  if (guarded) return guarded;

  return `${quotedMessage}短いけど、ちょっと気持ち乗ってそう。急いで答え出さなくていいから、まず今いちばん引っかかってるところだけ聞かせて🙂`;
}
