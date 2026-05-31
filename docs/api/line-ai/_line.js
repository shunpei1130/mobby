import { createHmac, timingSafeEqual } from "crypto";
import { stripEmojiForFallback, truncateText } from "./_text.js";

const MARK_AS_READ_TIMEOUT_MS = 1500;
const PROFILE_TIMEOUT_MS = 1500;

export async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  if (req.body && typeof req.body === "object") return Buffer.from(JSON.stringify(req.body), "utf8");

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function verifyLineSignature(rawBody, signature, channelSecret) {
  if (!signature || !channelSecret) return false;
  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""), "utf8");
  const expected = createHmac("sha256", channelSecret).update(bodyBuffer).digest("base64");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function markLineMessageAsRead(markAsReadToken) {
  const token = String(markAsReadToken || "").trim();
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !accessToken) return { ok: false, skipped: token ? "missing_access_token" : "missing_mark_token" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MARK_AS_READ_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.line.me/v2/bot/chat/markAsRead", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ markAsReadToken: token })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[LINE AI] Mark as read failed:", { status: response.status, body: text.slice(0, 200) });
      return { ok: false, status: response.status };
    }

    return { ok: true };
  } catch (error) {
    console.error("[LINE AI] Mark as read failed:", { message: error?.message });
    return { ok: false, error };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLineUserProfile(lineUserId) {
  const userId = String(lineUserId || "").trim();
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!userId || !accessToken) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok || typeof response.json !== "function") return null;

    const data = await response.json();
    const displayName = truncateText(data?.displayName, 80).replace(/\s+/g, " ").trim();
    return displayName ? { displayName } : null;
  } catch (error) {
    console.warn("[LINE AI] LINE profile lookup skipped:", { message: error?.message });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function replyLineMessage(replyToken, messages) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!replyToken) return { ok: false, skipped: "missing_reply_token" };
  if (!accessToken) {
    console.warn("[LINE AI] LINE_CHANNEL_ACCESS_TOKEN is not configured. Reply skipped.");
    return { ok: false, skipped: "missing_access_token" };
  }

  const lineMessages = (Array.isArray(messages) ? messages : [{ type: "text", text: String(messages || "") }])
    .map((message) => {
      if (message?.type !== "text") return message;
      return { ...message, text: truncateText(message.text, 5000) || "うん、聞いてるよ。" };
    });

  async function send(lineMessages) {
    return fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: lineMessages
      })
    });
  }

  const response = await send(lineMessages);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 400 && lineMessages.some((message) => message?.type === "text")) {
      const fallbackMessages = lineMessages.map((message) => {
        if (message?.type !== "text") return message;
        const fallbackText = truncateText(stripEmojiForFallback(message.text), 5000) || "うん、聞いてるよ。";
        return { ...message, text: fallbackText };
      });
      const retryResponse = await send(fallbackMessages);
      if (retryResponse.ok) {
        console.warn("[LINE AI] Reply retried without emoji-like characters after LINE rejected the first text.", {
          status: response.status,
          body: text.slice(0, 200)
        });
        return { ok: true, retried: true };
      }
      const retryText = await retryResponse.text().catch(() => "");
      console.error("[LINE AI] Reply failed after fallback retry:", {
        status: retryResponse.status,
        body: retryText.slice(0, 200),
        originalStatus: response.status,
        originalBody: text.slice(0, 200)
      });
      return { ok: false, status: retryResponse.status };
    }

    console.error("[LINE AI] Reply failed:", { status: response.status, body: text.slice(0, 200) });
    return { ok: false, status: response.status };
  }

  return { ok: true };
}

export function toLineTextMessage(text) {
  return {
    type: "text",
    text: truncateText(text, 5000) || "うん、聞いてるよ。"
  };
}
