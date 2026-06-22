import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { getR2Json, publicR2Url, putR2Json, putR2Object } from "./_r2.js";

export const GACHA_PRODUCT_TYPE = "seal_gacha";

const RARITY_CONFIG = [
  { key: "SR", dir: "sr", rate: 20 / 30 },
  { key: "UR", dir: "ur", rate: 8 / 30 },
  { key: "プリ", dir: "gal", rate: 2 / 30 }
];

const SECRET_DIRS = ["main4/full", "main4/half"];
const SHEET_SIZE = 6;
const SECRET_SHEET_RATE = 1 / 500;
const RESULT_IMAGE_PREFIX = process.env.R2_RESULT_IMAGE_PREFIX || "result-images/";
const DRAW_RECORD_PREFIX = process.env.R2_DRAW_RECORD_PREFIX || "draw-records/";
const LINE_QUEUE_PREFIX = process.env.R2_LINE_QUEUE_PREFIX || "line-queue/";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.resolve(__dirname, "../gacha-new/assets");
const sheetTemplatePath = path.join(assetsRoot, "gacha/gachasheet.png");
const secretSheetTemplatePath = path.join(assetsRoot, "gacha/gacha-sheet-mobby-4.png");

const sheetSlots = [
  { x: 102, y: 102, width: 386, height: 386 },
  { x: 537, y: 102, width: 386, height: 386 },
  { x: 102, y: 539, width: 386, height: 386 },
  { x: 537, y: 539, width: 386, height: 386 },
  { x: 102, y: 975, width: 386, height: 386 },
  { x: 537, y: 975, width: 386, height: 386 }
];
const secretSheetSlots = [
  { x: 102, y: 320, width: 386, height: 386 },
  { x: 537, y: 320, width: 386, height: 386 },
  { x: 102, y: 757, width: 386, height: 386 },
  { x: 537, y: 757, width: 386, height: 386 }
];

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
  const sheet = files.map((fileName, offset) => ({
    index: indexStart + offset + 1,
    rarity: "SECRET",
    dir,
    fileName,
    title: fileName.replace(/\.png$/i, "").replace(/-(full|half)$/i, "")
  }));
  while (sheet.length < SHEET_SIZE) {
    sheet.push({
      index: indexStart + sheet.length + 1,
      rarity: "SECRET",
      title: "SECRET",
      isSpacer: true
    });
  }
  return sheet;
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

    for (let index = 0; index < SHEET_SIZE; index += 1) {
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

function ensurePrefix(value) {
  const prefix = String(value || "").trim().replace(/^\/+/u, "");
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

function drawRecordKey(drawId) {
  return `${ensurePrefix(DRAW_RECORD_PREFIX)}${drawId}.json`;
}

function lineQueueKey(drawId, scheduledAt) {
  const stamp = new Date(scheduledAt).toISOString().replace(/[:.]/gu, "-");
  return `${ensurePrefix(LINE_QUEUE_PREFIX)}${stamp}_${drawId}.json`;
}

function resultImageKey(drawId, index, total) {
  return `${ensurePrefix(RESULT_IMAGE_PREFIX)}${drawId}_sheet_${String(index + 1).padStart(2, "0")}of${String(total).padStart(2, "0")}.png`;
}

function previewImageKey(drawId, index, total) {
  return `${ensurePrefix(RESULT_IMAGE_PREFIX)}${drawId}_sheet_${String(index + 1).padStart(2, "0")}of${String(total).padStart(2, "0")}_preview.jpg`;
}

function chunkSheetResults(selectedResults) {
  const chunks = [];
  for (let index = 0; index < selectedResults.length; index += SHEET_SIZE) {
    chunks.push(selectedResults.slice(index, index + SHEET_SIZE));
  }
  return chunks;
}

function assetPath(result) {
  return path.join(assetsRoot, result.dir, result.fileName);
}

function clientAssetUrl(result) {
  return `../gacha-new/assets/${result.dir}/${encodeURIComponent(result.fileName)}`;
}

function toClientResult(result) {
  if (result.isSpacer) return result;
  return {
    rarity: result.rarity,
    title: result.title,
    src: clientAssetUrl(result),
    dir: result.dir,
    fileName: result.fileName
  };
}

async function resizeStickerForSlot(result, slot, fit) {
  return sharp(assetPath(result))
    .resize(slot.width, slot.height, { fit })
    .png()
    .toBuffer();
}

async function composeSheetPng(chunk) {
  const drawableResults = chunk.filter((result) => !result.isSpacer);
  const isSecretOnlySheet = drawableResults.length > 0 && drawableResults.every((result) => result.rarity === "SECRET");
  const templatePath = isSecretOnlySheet ? secretSheetTemplatePath : sheetTemplatePath;
  const composites = [];

  for (let index = 0; index < drawableResults.length; index += 1) {
    const result = drawableResults[index];
    const originalIndex = chunk.indexOf(result);
    const slot = isSecretOnlySheet
      ? secretSheetSlots[index % secretSheetSlots.length]
      : sheetSlots[originalIndex % sheetSlots.length];
    composites.push({
      input: await resizeStickerForSlot(result, slot, isSecretOnlySheet ? "contain" : "cover"),
      left: slot.x,
      top: slot.y
    });
  }

  return sharp(templatePath).composite(composites).png().toBuffer();
}

async function composePreviewJpeg(pngBuffer) {
  let quality = 78;
  let width = 800;
  let output = await sharp(pngBuffer)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (output.length > 950_000 && quality > 52) {
    quality -= 8;
    output = await sharp(pngBuffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  while (output.length > 950_000 && width > 560) {
    width -= 100;
    output = await sharp(pngBuffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 58, mozjpeg: true })
      .toBuffer();
  }

  return output;
}

async function uploadResultSheets(drawId, selectedResults) {
  const chunks = chunkSheetResults(selectedResults);
  const images = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const png = await composeSheetPng(chunks[index]);
    const key = resultImageKey(drawId, index, chunks.length);
    const preview = await composePreviewJpeg(png);
    const previewKey = previewImageKey(drawId, index, chunks.length);
    await putR2Object(key, png, "image/png");
    await putR2Object(previewKey, preview, "image/jpeg");
    images.push({
      index: index + 1,
      key,
      url: publicR2Url(key),
      preview_key: previewKey,
      preview_url: publicR2Url(previewKey),
      size: png.length,
      preview_size: preview.length
    });
  }
  return images;
}

export async function loadGachaDrawRecord(drawId) {
  const id = safeText(drawId, 120);
  if (!id) return null;
  return getR2Json(drawRecordKey(id));
}

export async function createPaidGachaDraw({ stripeSession }) {
  const session = stripeSession || {};
  const metadata = session.metadata || {};
  const drawId = safeText(metadata.draw_id, 120) || crypto.randomUUID();
  const existing = await loadGachaDrawRecord(drawId);
  if (existing?.status === "paid_result_fixed") return existing;

  if (safeText(metadata.product_type, 80).toLowerCase() !== GACHA_PRODUCT_TYPE) {
    return { skipped: true, reason: "not_gacha" };
  }
  if (safeText(session.payment_status, 40).toLowerCase() !== "paid") {
    return { skipped: true, reason: "not_paid" };
  }

  const lineUserId = safeText(metadata.line_user_id, 100);
  if (!lineUserId) throw new Error("line_user_id is missing");

  const pulls = Math.max(1, Math.min(10, Number(metadata.pulls || 1)));
  const selectedResults = pickResults(pulls * SHEET_SIZE);
  const sheetImages = await uploadResultSheets(drawId, selectedResults);
  const now = new Date();
  const delaySeconds = Math.max(0, Number(process.env.GACHA_LINE_DELIVERY_DELAY_SECONDS || 120));
  const scheduledAt = new Date(now.getTime() + delaySeconds * 1000).toISOString();
  const record = {
    version: 1,
    draw_id: drawId,
    stripe_session_id: session.id || "",
    line_user_id: lineUserId,
    package_type: safeText(metadata.package_type, 40),
    pulls,
    status: "paid_result_fixed",
    paid_at: now.toISOString(),
    result_count: selectedResults.filter((result) => !result.isSpacer).length,
    results: selectedResults.map(toClientResult),
    sheet_images: sheetImages,
    line_delivery: {
      scheduled_at: scheduledAt,
      delivered: false,
      delivered_at: null,
      error: ""
    }
  };

  await putR2Json(drawRecordKey(drawId), record);
  await putR2Json(lineQueueKey(drawId, scheduledAt), {
    draw_id: drawId,
    record_key: drawRecordKey(drawId),
    scheduled_at: scheduledAt,
    delivered: false
  });
  return record;
}


