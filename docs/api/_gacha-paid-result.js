import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

export const GACHA_PRODUCT_TYPE = "seal_gacha";

const RARITY_CONFIG = [
  { key: "R", dir: "r", rate: 0.7 },
  { key: "SR", dir: "sr", rate: 0.2 },
  { key: "UR", dir: "ur", rate: 0.08 },
  { key: "プリ", dir: "gal", rate: 0.02 }
];

const SECRET_DIRS = ["main4/full", "main4/half"];
const SHEET_SIZE = 6;
const SECRET_SHEET_RATE = 1 / 500;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.resolve(__dirname, "../gacha-new/assets");

export function normalizeEmail(value) {
  return String(value || "").trim();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function safeText(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

export function resolveOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  if (!host) return "https://www.mobby.online";
  return `${proto}://${host}`;
}

function formatFrom(value) {
  const from = String(value || "").trim();
  if (!from) return "";
  return from.includes("<") ? from : `Mobby <${from}>`;
}

function pickRarity() {
  const roll = crypto.randomInt(0, 1_000_000) / 1_000_000;
  let cursor = 0;
  for (const rarity of RARITY_CONFIG) {
    cursor += rarity.rate;
    if (roll < cursor) return rarity;
  }
  return RARITY_CONFIG[0];
}

function listFiles(dir) {
  const fullPath = path.join(assetsRoot, dir);
  return fs.readdirSync(fullPath)
    .filter((fileName) => fileName.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "ja"));
}

function buildPools() {
  return Object.fromEntries(RARITY_CONFIG.map((rarity) => [rarity.dir, listFiles(rarity.dir)]));
}

function buildSecretPools() {
  return Object.fromEntries(SECRET_DIRS.map((dir) => [dir, listFiles(dir)]));
}

function buildSecretSheet(secretPools, indexStart, dir) {
  const files = secretPools[dir] || [];
  return files.map((fileName, offset) => ({
    index: indexStart + offset + 1,
    rarity: "SECRET",
    dir,
    fileName,
    title: fileName.replace(/\.png$/i, "").replace(/-(full|half)$/i, "")
  }));
}

function pickResults(count) {
  const pools = buildPools();
  const secretPools = buildSecretPools();
  const sheetCount = Math.max(1, Math.ceil(count / SHEET_SIZE));
  const results = [];
  const dir = SECRET_DIRS[crypto.randomInt(0, SECRET_DIRS.length)];
  for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex += 1) {
    if (crypto.randomInt(0, Math.round(1 / SECRET_SHEET_RATE)) === 0) {
      results.push(...buildSecretSheet(secretPools, results.length, dir));
      continue;
    }

    const remaining = count - results.length;
    const sheetLength = Math.min(SHEET_SIZE, Math.max(0, remaining));
    for (let index = 0; index < sheetLength; index += 1) {
      const rarity = pickRarity();
      const files = pools[rarity.dir] || [];
      const fileName = files[crypto.randomInt(0, files.length)];
      results.push({
        index: results.length + 1,
        rarity: rarity.key,
        dir: rarity.dir,
        fileName,
        title: fileName.replace(/\.png$/i, "").replace(/-(sr|ur|gal)$/i, "")
      });
    }
  }
  return results;
}

function assetUrl(baseUrl, result) {
  return `${baseUrl.replace(/\/$/u, "")}/gacha-new/assets/${result.dir}/${encodeURIComponent(result.fileName)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildResultHtml(results, baseUrl) {
  const items = results.map((result) => {
    const url = assetUrl(baseUrl, result);
    const title = escapeHtml(result.title);
    const rarity = escapeHtml(result.rarity);
    return `
      <li style="margin:0 0 14px;padding:0;list-style:none;">
        <p style="margin:0 0 6px;font-weight:700;">${result.index}. ${rarity} / ${title}</p>
        <img src="${url}" alt="${title}" style="display:block;width:160px;max-width:100%;border-radius:12px;">
      </li>
    `;
  }).join("");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#332318;">
      <h1 style="font-size:20px;margin:0 0 12px;">Mobbyシールガチャの結果です</h1>
      <p style="margin:0 0 16px;">決済完了後に抽選されたシール結果をお送りします。</p>
      <ul style="margin:0;padding:0;">${items}</ul>
    </div>
  `;
}

function buildResultText(results) {
  return [
    "Mobbyシールガチャの結果です。",
    "",
    ...results.map((result) => `${result.index}. ${result.rarity} / ${result.title}`)
  ].join("\n");
}

async function fetchStripeSession(stripeSecretKey, sessionId) {
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${stripeSecretKey}` }
  });
  const stripeData = await stripeRes.json().catch(() => ({}));
  if (!stripeRes.ok) {
    throw new Error(stripeData?.error?.message || stripeData?.message || "Failed to load checkout session");
  }
  return stripeData;
}

async function updateStripeSessionMetadata(stripeSecretKey, sessionId, metadata) {
  const form = new URLSearchParams();
  Object.entries(metadata).forEach(([key, value]) => {
    form.set(`metadata[${key}]`, String(value));
  });

  await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
}

export async function sendPaidGachaResultEmail({ stripeSecretKey, sessionId, stripeSession, baseUrl }) {
  const session = stripeSession || await fetchStripeSession(stripeSecretKey, sessionId);
  const metadata = session?.metadata || {};

  if (safeText(metadata.product_type, 80).toLowerCase() !== GACHA_PRODUCT_TYPE) {
    return { sent: false, skipped: true, reason: "not_gacha" };
  }

  if (safeText(session.payment_status, 40).toLowerCase() !== "paid") {
    return { sent: false, skipped: true, reason: "not_paid" };
  }

  if (metadata.result_sent_at) {
    return { sent: false, skipped: true, reason: "already_sent" };
  }

  const email = normalizeEmail(metadata.recipient_email);
  if (!email || !isValidEmail(email)) {
    throw new Error("Recipient email is missing");
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = formatFrom(process.env.GACHA_STICKER_FROM_EMAIL || process.env.FROM_EMAIL);
  if (!resendKey || !from) {
    throw new Error("Server env not set");
  }

  const pulls = Math.max(1, Math.min(10, Number(metadata.pulls || 1)));
  const results = pickResults(pulls * 6);
  const resultBaseUrl = baseUrl || metadata.result_base_url || "https://www.mobby.online";

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from,
    to: [email],
    subject: "Mobbyシールガチャの結果です",
    text: buildResultText(results),
    html: buildResultHtml(results, resultBaseUrl)
  });

  await updateStripeSessionMetadata(stripeSecretKey, session.id || sessionId, {
    result_sent_at: new Date().toISOString(),
    result_count: String(results.length)
  });

  return { sent: true, skipped: false, count: results.length, email };
}
