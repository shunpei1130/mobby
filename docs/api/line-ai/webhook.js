import { createHash } from "crypto";
import { generateReply } from "./_ai.js";
import {
  getLineUserProfile,
  markLineMessageAsRead,
  replyLineMessage,
  readRawBody,
  toLineTextMessage,
  verifyLineSignature
} from "./_line.js";
import { buildRateLimitReply, canReplyGlobally, canReplyWithConversation, recordGlobalReply, recordReply, todayKey } from "./_rate-limit.js";
import { buildSafetyReply, detectSafetyRisk } from "./_safety.js";
import {
  appendConversationMessage,
  loadConversation,
  loadUser,
  saveConversation,
  saveUser
} from "./_storage.js";
import { normalizeLineMessageText } from "./_text.js";

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

async function reply(event, text) {
  return replyLineMessage(event.replyToken, [toLineTextMessage(text)]);
}

function buildGreetingPrompt() {
  return "モビーだよ！「私の診断結果は？」って聞いてみてね！";
}

function buildDefaultUser(userKey) {
  return {
    version: 1,
    userKey,
    source: "line",
    sourceLabel: "LINE直接",
    registeredAt: new Date().toISOString(),
    lastMessageAt: "",
    messageCountDate: "",
    messageCountToday: 0
  };
}

function replyCountToday(user) {
  const today = todayKey();
  return user?.messageCountDate === today ? Number(user?.messageCountToday || 0) : 0;
}

function isDuplicateLineMessage(conversation, messageId) {
  if (!messageId) return false;
  return Array.isArray(conversation?.processedLineMessageIds)
    && conversation.processedLineMessageIds.includes(messageId);
}

function rememberLineMessage(conversation, messageId) {
  if (!messageId) return conversation;
  const existing = Array.isArray(conversation?.processedLineMessageIds)
    ? conversation.processedLineMessageIds
    : [];
  return {
    ...conversation,
    processedLineMessageIds: [messageId, ...existing.filter((id) => id !== messageId)].slice(0, 80)
  };
}

function shouldOfferDisplayNameCue(user, text) {
  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider !== "gemini") return false;

  const nextReplyCount = replyCountToday(user) + 1;
  if (nextReplyCount < 4) return false;

  const message = String(text || "");
  const supportiveMoment = /ありがとう|助かった|嬉|うれし|不安|つら|辛|しんど|疲れ|相談|迷っ|どうしよう|頑張|がんば/.test(message);
  return nextReplyCount % 6 === 0 || (supportiveMoment && nextReplyCount % 4 === 0);
}

async function buildPromptUser(user, event, text) {
  if (!shouldOfferDisplayNameCue(user, text)) return user;

  const profile = await getLineUserProfile(event?.source?.userId);
  if (!profile?.displayName) return user;

  return {
    ...user,
    lineDisplayName: profile.displayName,
    lineDisplayNameUseAllowed: true
  };
}

async function ensureDefaultUser(userKey) {
  const existing = await loadUser(userKey);
  if (existing) return existing;

  const user = buildDefaultUser(userKey);
  await saveUser(userKey, user);
  await saveConversation(userKey, {
    version: 1,
    userKey,
    messages: [{ role: "assistant", text: buildGreetingPrompt(), at: new Date().toISOString() }],
    summary: "",
    dailyCountDate: "",
    dailyCount: 0
  });
  return user;
}

async function handleLinkedMessage(event, userKey, user, text) {
  let conversation = await loadConversation(userKey);
  conversation = conversation && typeof conversation === "object" ? conversation : { version: 1, userKey, messages: [] };
  const lineMessageId = String(event?.message?.id || "");
  if (isDuplicateLineMessage(conversation, lineMessageId)) return;

  const safety = detectSafetyRisk(text);
  let responseText = "";
  let nextUser = user;
  let nextConversation = appendConversationMessage(conversation, "user", text);

  if (safety.hasRisk) {
    responseText = buildSafetyReply(safety);
  } else {
    const userLimit = canReplyWithConversation(user, conversation);
    const totalLimit = canReplyGlobally(conversation);
    if (!userLimit.ok || !totalLimit.ok) {
      responseText = buildRateLimitReply();
    } else {
      const promptUser = await buildPromptUser(user, event, text);
      responseText = await generateReply({
        user: promptUser,
        message: text,
        history: Array.isArray(conversation.messages) ? conversation.messages.slice(-12) : []
      });
      nextUser = recordReply(user, new Date(), userLimit.count);
      nextConversation = recordGlobalReply(nextConversation);
    }
  }

  nextConversation = appendConversationMessage(nextConversation, "assistant", responseText);
  nextConversation = rememberLineMessage(nextConversation, lineMessageId);
  await saveUser(userKey, nextUser);
  await saveConversation(userKey, nextConversation);
  await reply(event, responseText);
}

async function handleTextEvent(event) {
  const lineUserId = event?.source?.userId;
  const text = normalizeLineMessageText(event?.message);
  if (!lineUserId || !text) return;

  const userKey = userKeyFromLineId(lineUserId);
  const user = await ensureDefaultUser(userKey);

  await handleLinkedMessage(event, userKey, user, text);
}

async function handleEvent(event) {
  if (event?.type === "follow") {
    const lineUserId = event?.source?.userId;
    if (lineUserId) {
      await ensureDefaultUser(userKeyFromLineId(lineUserId));
    }
    await reply(event, buildGreetingPrompt());
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
