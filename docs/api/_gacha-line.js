import crypto from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60;
export const LINE_MESSAGE_LIMIT = 5;

export function safeText(value, max = 300) {
  return String(value || "").trim().slice(0, max);
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
}

function tokenSecret() {
  const secret = process.env.GACHA_LINE_LINK_SECRET || process.env.STRIPE_SECRET_KEY || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  if (!secret) throw new Error("GACHA_LINE_LINK_SECRET or fallback secret is not configured");
  return secret;
}

function signPayload(payload) {
  return crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

export function createLineLinkToken(lineUserId) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode({
    lineUserId: safeText(lineUserId, 80),
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  });
  return `${payload}.${signPayload(payload)}`;
}

export function verifyLineLinkToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  const data = base64UrlDecode(payload);
  if (!data?.lineUserId || Number(data.exp || 0) < Math.floor(Date.now() / 1000)) return null;
  return { lineUserId: safeText(data.lineUserId, 80) };
}

export async function verifyLineIdToken(idToken) {
  const clientId = safeText(process.env.LINE_LOGIN_CHANNEL_ID, 40);
  if (!clientId) throw new Error("LINE_LOGIN_CHANNEL_ID is not configured");
  const token = safeText(idToken, 3000);
  if (!token) throw new Error("idToken is missing");

  const form = new URLSearchParams();
  form.set("id_token", token);
  form.set("client_id", clientId);

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.sub) {
    throw new Error(data?.error_description || data?.error || "LINE id token verify failed");
  }
  if (safeText(data.aud, 80) !== clientId) {
    throw new Error("LINE id token audience mismatch");
  }
  return {
    lineUserId: safeText(data.sub, 80),
    name: safeText(data.name, 120),
    picture: safeText(data.picture, 500)
  };
}

async function pushLineMessages(lineUserId, messages, retryKey = "") {
  const accessToken = safeText(process.env.LINE_CHANNEL_ACCESS_TOKEN, 3000);
  if (!accessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
  if (retryKey) headers["X-Line-Retry-Key"] = retryKey;

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers,
    body: JSON.stringify({ to: lineUserId, messages })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LINE push failed: ${response.status} ${text.slice(0, 300)}`);
  }
}

function normalizeImageItems(imageUrls, imageItems) {
  if (Array.isArray(imageItems) && imageItems.length) {
    return imageItems
      .map((item) => ({
        url: safeText(item?.url, 2000),
        previewUrl: safeText(item?.preview_url || item?.previewUrl || item?.url, 2000)
      }))
      .filter((item) => item.url && item.previewUrl);
  }
  return (Array.isArray(imageUrls) ? imageUrls : [])
    .filter(Boolean)
    .map((url) => ({ url, previewUrl: url }));
}

function toLineImageMessage(item) {
  return {
    type: "image",
    originalContentUrl: item.url,
    previewImageUrl: item.previewUrl
  };
}

export function buildGachaResultLineMessageBatches(items) {
  const imageItems = Array.isArray(items) ? items : [];
  const firstImageCount = LINE_MESSAGE_LIMIT - 1;
  const firstBatch = [
    {
      type: "text",
      text: "Mobbyシールガチャの結果が届きました。\n画像の保存期限は14日間です。"
    },
    ...imageItems.slice(0, firstImageCount).map(toLineImageMessage)
  ];
  const batches = [firstBatch];

  for (let index = firstImageCount; index < imageItems.length; index += LINE_MESSAGE_LIMIT) {
    batches.push(imageItems.slice(index, index + LINE_MESSAGE_LIMIT).map(toLineImageMessage));
  }
  return batches;
}

export async function sendGachaResultLineMessage({ lineUserId, drawId, imageUrls, imageItems }) {
  const items = normalizeImageItems(imageUrls, imageItems);
  if (!lineUserId) throw new Error("lineUserId is missing");
  if (!items.length) throw new Error("imageUrls is missing");

  const batches = buildGachaResultLineMessageBatches(items);
  for (let index = 0; index < batches.length; index += 1) {
    await pushLineMessages(lineUserId, batches[index], `${drawId}-line-${index}`);
  }
}
