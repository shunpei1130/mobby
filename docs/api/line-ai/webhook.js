import { createHash } from "crypto";
import { generateReply } from "./_ai.js";
import {
  markLineMessageAsRead,
  replyLineMessage,
  readRawBody,
  toLineTextMessage,
  verifyLineSignature
} from "./_line.js";
import { buildRateLimitReply, canReply, canReplyGlobally, recordGlobalReply, recordReply } from "./_rate-limit.js";
import { buildSafetyReply, detectSafetyRisk } from "./_safety.js";
import {
  appendConversationMessage,
  loadConversation,
  loadToken,
  loadUser,
  saveConversation,
  saveToken,
  saveUser
} from "./_storage.js";

const TOKEN_PATTERN = /\bMB-[A-Z0-9]{6}\b/i;

export const config = {
  api: {
    bodyParser: false
  }
};

function userKeyFromLineId(lineUserId) {
  const secret = process.env.MOBBY_LINE_AI_SECRET;
  if (!secret) throw new Error("MOBBY_LINE_AI_SECRET is not configured");
  return createHash("sha256").update(`${lineUserId}:${secret}`).digest("hex");
}

function extractToken(text) {
  const match = String(text || "").match(TOKEN_PATTERN);
  return match ? match[0].toUpperCase() : "";
}

async function reply(event, text) {
  return replyLineMessage(event.replyToken, [toLineTextMessage(text)]);
}

function buildRegisterPrompt() {
  return "まだあなた専用モビーの準備ができていないみたい。診断結果画面から「LINEでモビーを追加する」を押して、合言葉を送ってね。";
}

function buildFollowPrompt() {
  return "友だち追加ありがとう。診断結果画面で発行した合言葉を、このトークに送ってね。";
}

function buildLinkedPrompt(user) {
  return `${user.resultName}のモビーとして登録できたよ。AIモビーは専門家ではないけれど、今日の悩みを短く一緒に整理するね。`;
}

async function linkTokenToUser(event, userKey, tokenText) {
  const token = await loadToken(tokenText);
  if (!token) {
    await reply(event, "その合言葉は見つからなかったよ。診断結果画面からもう一度発行して送ってね。");
    return;
  }

  const now = Date.now();
  const expiresAt = new Date(token.expiresAt || 0).getTime();
  if (!expiresAt || expiresAt <= now) {
    await saveToken(tokenText, { ...token, status: "expired" });
    await reply(event, "その合言葉は期限切れみたい。診断結果画面からもう一度発行して送ってね。");
    return;
  }

  if (token.status === "used") {
    await reply(event, "その合言葉はすでに使われています。新しく連携する場合は、診断結果画面からもう一度発行してね。");
    return;
  }

  const diagnosis = token.diagnosis || {};
  const user = {
    version: 1,
    userKey,
    source: diagnosis.source,
    sourceLabel: diagnosis.sourceLabel,
    resultId: diagnosis.resultId,
    resultName: diagnosis.resultName,
    resultSummary: diagnosis.resultSummary,
    traits: Array.isArray(diagnosis.traits) ? diagnosis.traits : [],
    registeredAt: new Date().toISOString(),
    lastMessageAt: "",
    messageCountDate: "",
    messageCountToday: 0
  };

  await saveUser(userKey, user);
  await saveToken(tokenText, {
    ...token,
    status: "used",
    usedAt: new Date().toISOString(),
    userKey
  });
  await saveConversation(userKey, {
    version: 1,
    userKey,
    messages: [{ role: "assistant", text: buildLinkedPrompt(user), at: new Date().toISOString() }],
    summary: "",
    dailyCountDate: "",
    dailyCount: 0
  });

  await reply(event, buildLinkedPrompt(user));
}

async function handleLinkedMessage(event, userKey, user, text) {
  let conversation = await loadConversation(userKey);
  conversation = conversation && typeof conversation === "object" ? conversation : { version: 1, userKey, messages: [] };

  const safety = detectSafetyRisk(text);
  let responseText = "";
  let nextUser = user;
  let nextConversation = appendConversationMessage(conversation, "user", text);

  if (safety.hasRisk) {
    responseText = buildSafetyReply(safety);
  } else {
    const userLimit = canReply(user);
    const totalLimit = canReplyGlobally(conversation);
    if (!userLimit.ok || !totalLimit.ok) {
      responseText = buildRateLimitReply();
    } else {
      responseText = await generateReply({
        user,
        message: text,
        history: Array.isArray(conversation.messages) ? conversation.messages.slice(-12) : []
      });
      nextUser = recordReply(user);
      nextConversation = recordGlobalReply(nextConversation);
    }
  }

  nextConversation = appendConversationMessage(nextConversation, "assistant", responseText);
  await saveUser(userKey, nextUser);
  await saveConversation(userKey, nextConversation);
  await reply(event, responseText);
}

async function handleTextEvent(event) {
  const lineUserId = event?.source?.userId;
  const text = String(event?.message?.text || "").trim();
  if (!lineUserId || !text) return;

  const userKey = userKeyFromLineId(lineUserId);
  const tokenText = extractToken(text);
  if (tokenText) {
    await linkTokenToUser(event, userKey, tokenText);
    return;
  }

  const user = await loadUser(userKey);
  if (!user) {
    await reply(event, buildRegisterPrompt());
    return;
  }

  await handleLinkedMessage(event, userKey, user, text);
}

async function handleEvent(event) {
  if (event?.type === "follow") {
    await reply(event, buildFollowPrompt());
    return;
  }

  if (event?.type === "message" && event?.message?.type === "text") {
    await markLineMessageAsRead(event.message.markAsReadToken);
    await handleTextEvent(event);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    return res.status(500).json({ ok: false, error: "LINE_CHANNEL_SECRET is not configured" });
  }
  if (!process.env.MOBBY_LINE_AI_SECRET) {
    return res.status(500).json({ ok: false, error: "MOBBY_LINE_AI_SECRET is not configured" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-line-signature"];
  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    return res.status(401).json({ ok: false, error: "Invalid LINE signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  try {
    const events = Array.isArray(payload.events) ? payload.events : [];
    for (const event of events) {
      await handleEvent(event);
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[LINE AI WEBHOOK] error:", { message: error?.message });
    return res.status(500).json({ ok: false, error: "Internal Error" });
  }
}
