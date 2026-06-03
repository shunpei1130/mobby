import { buildSystemPrompt } from "./_prompts.js";
import { isOwnResultQuestion } from "./_diagnosis-knowledge.js";
import { cleanUnicodeText, truncateText, unicodeLength } from "./_text.js";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_OLLAMA_MODEL = "qwen3.5:9b";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_TIMEOUT_MS = 60 * 1000;
const DEFAULT_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0.7;

export const IMAGE_OUTPUT_UNSUPPORTED_REPLY = [
  "ごめんね、今は画像の作成や送付には対応していないんだ。",
  "診断結果のまとめは、文章でならわかりやすく伝えられるよ！"
].join("\n");

export const IMAGE_INPUT_UNSUPPORTED_REPLY = [
  "ごめんね、画像の内容を確認することはできないんだ。",
  "文字で内容を教えてくれたら、それに合わせて答えるよ！"
].join("\n");

const IMAGE_OBJECT_PATTERN = /(画像|写真|スクショ|スクリーンショット|イラスト|アイコン|壁紙|まとめ画像)/;
const IMAGE_OUTPUT_INTENT_PATTERN = /(画像化|画像にして|画像で|作成|作って|つくって|作れる|作れ|生成|送って|送付|送信|見せて|欲しい|ほしい|ください|ちょうだい|出して|できる|出来る)/;

export function buildUnsupportedImageIntentReply(message) {
  const text = cleanUnicodeText(message).replace(/\s+/g, "");
  if (!text || !IMAGE_OBJECT_PATTERN.test(text)) return "";

  const asksAboutImageContent =
    /(画像|写真|スクショ|スクリーンショット).*(見て|みて|見れる|見られる|確認|読んで|解析|分析|診断|判断|分かる|わかる|内容|送った|添付)/.test(text) ||
    /(見て|みて|確認|読んで|解析|分析|判断|分かる|わかる|内容).*(画像|写真|スクショ|スクリーンショット)/.test(text);
  if (asksAboutImageContent) return IMAGE_INPUT_UNSUPPORTED_REPLY;

  const asksForImageOutput =
    /(画像|写真|イラスト|アイコン|壁紙).*(作成|作って|つくって|作れる|作れ|生成|送って|送付|送信|見せて|欲しい|ほしい|ください|ちょうだい|出して|できる|出来る)/.test(text) ||
    /(まとめ画像|画像化|画像にして|画像でまとめ|画像のまとめ|まとめみたいな画像)/.test(text) ||
    IMAGE_OUTPUT_INTENT_PATTERN.test(text) && /画像/.test(text);
  if (asksForImageOutput) return IMAGE_OUTPUT_UNSUPPORTED_REPLY;

  return "";
}

function compact(text, max = 48) {
  const value = cleanUnicodeText(text).replace(/\s+/g, " ").trim();
  return unicodeLength(value) > max ? truncateText(value, max) : value;
}

function cleanReply(text) {
  return cleanUnicodeText(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function maxOutputTokens() {
  const value = Number(process.env.LINE_AI_MAX_OUTPUT_TOKENS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(Math.max(Math.floor(value), 180), 1400);
}

function temperature() {
  const value = Number(process.env.LINE_AI_TEMPERATURE);
  if (!Number.isFinite(value) || value < 0 || value > 2) return DEFAULT_TEMPERATURE;
  return value;
}

function ollamaTimeoutMs() {
  const value = Number(process.env.OLLAMA_TIMEOUT_MS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_OLLAMA_TIMEOUT_MS;
  return Math.min(Math.max(Math.floor(value), 5 * 1000), 5 * 60 * 1000);
}

function historyToContents(history, message) {
  const recent = Array.isArray(history) ? history.slice(-12) : [];
  const contents = recent
    .filter((item) => item?.role === "user" || item?.role === "assistant")
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: truncateText(item.text, 500) }]
    }))
    .filter((item) => item.parts[0].text);

  contents.push({
    role: "user",
    parts: [{ text: truncateText(message, 500) }]
  });
  return contents;
}

function historyToOllamaMessages(history, message, systemPrompt) {
  const recent = Array.isArray(history) ? history.slice(-12) : [];
  const messages = [
    {
      role: "system",
      content: systemPrompt
    }
  ];

  for (const item of recent) {
    if (item?.role !== "user" && item?.role !== "assistant") continue;
    const content = truncateText(item.text, 500);
    if (!content) continue;
    messages.push({
      role: item.role,
      content
    });
  }

  messages.push({
    role: "user",
    content: truncateText(message, 500)
  });
  return messages;
}

function loveGuardrail(message) {
  if (/追いLINE|監視|既読|位置|SNS|不安|依存|束縛/.test(message)) {
    return "それ、気になり始めると頭の中で通知音が鳴り続けるやつだよね。今は追い確認より一回スマホ置こ📱 送るなら責めない一言だけにしよ。";
  }
  return "";
}

function buildOwnResultFallbackReply({ user, message, history }) {
  if (!isOwnResultQuestion(message, history)) return "";

  if (user?.personalResultLinked && user?.resultName) {
    const sourceLabel = user.sourceLabel ? `${user.sourceLabel}の` : "";
    const summary = user.resultSummary ? `\n${user.resultSummary}` : "";
    return `あなたの診断結果は${sourceLabel}「${user.resultName}」だよ。${summary}\n気になるところがあれば、そこから一緒に話そ🙂`;
  }

  return "今のLINEでは、まだあなたの診断結果は連携されていないみたい。診断結果ページからLINE連携すると、結果をふまえて話せるよ🙂";
}

export async function generateReply({ user, message, history }) {
  const unsupportedImageReply = buildUnsupportedImageIntentReply(message);
  if (unsupportedImageReply) return unsupportedImageReply;

  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "gemini") {
    try {
      return await generateGeminiReply({ user, message, history });
    } catch (error) {
      console.error("[LINE AI] Gemini reply failed. Falling back to mock.", {
        message: error?.message,
        status: error?.status
      });
      return generateMockReply({ user, message, history });
    }
  }
  if (provider === "ollama") {
    try {
      return await generateOllamaReply({ user, message, history });
    } catch (error) {
      console.error("[LINE AI] Ollama reply failed. Falling back to mock.", {
        message: error?.message,
        status: error?.status
      });
      return generateMockReply({ user, message, history });
    }
  }
  if (provider !== "mock") {
    console.warn("[LINE AI] Unknown provider. Falling back to mock.", { provider });
  }
  return generateMockReply({ user, message, history });
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
        parts: [{ text: buildSystemPrompt(user, message, history) }]
      },
      contents: historyToContents(history, message),
      generationConfig: {
        temperature: temperature(),
        topP: 0.9,
        maxOutputTokens: maxOutputTokens(),
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
  return cleanReply(text);
}

export async function generateOllamaReply({ user, message, history }) {
  const model = String(process.env.AI_MODEL || DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;
  const baseUrl = String(process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("OLLAMA_BASE_URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ollamaTimeoutMs());

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        messages: historyToOllamaMessages(history, message, buildSystemPrompt(user, message, history)),
        options: {
          temperature: temperature(),
          top_p: 0.9,
          num_predict: maxOutputTokens()
        }
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const error = new Error(`Ollama API returned ${response.status}`);
      error.status = response.status;
      error.body = body.slice(0, 300);
      throw error;
    }

    const data = await response.json();
    const text = String(data?.message?.content || "").trim();
    if (!text) {
      throw new Error("Ollama API returned an empty reply");
    }
    return cleanReply(text);
  } finally {
    clearTimeout(timeout);
  }
}

export function generateMockReply({ user, message, history }) {
  const unsupportedImageReply = buildUnsupportedImageIntentReply(message);
  if (unsupportedImageReply) return unsupportedImageReply;

  const ownResultReply = buildOwnResultFallbackReply({ user, message, history });
  if (ownResultReply) return ownResultReply;

  const userMessage = compact(message);
  const quotedMessage = userMessage ? `「${userMessage}」ね。` : "";

  const guarded = loveGuardrail(cleanUnicodeText(message));
  if (guarded) return guarded;

  return `${quotedMessage}短いけど、ちょっと気持ち乗ってそう。急いで答え出さなくていいから、まず今いちばん引っかかってるところだけ聞かせて🙂`;
}
