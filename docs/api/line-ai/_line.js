import { createHmac, timingSafeEqual } from "crypto";

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

export async function replyLineMessage(replyToken, messages) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!replyToken) return { ok: false, skipped: "missing_reply_token" };
  if (!accessToken) {
    console.warn("[LINE AI] LINE_CHANNEL_ACCESS_TOKEN is not configured. Reply skipped.");
    return { ok: false, skipped: "missing_access_token" };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages: Array.isArray(messages) ? messages : [{ type: "text", text: String(messages || "") }]
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[LINE AI] Reply failed:", { status: response.status, body: text.slice(0, 200) });
    return { ok: false, status: response.status };
  }

  return { ok: true };
}

export function toLineTextMessage(text) {
  return {
    type: "text",
    text: String(text || "").slice(0, 5000)
  };
}
