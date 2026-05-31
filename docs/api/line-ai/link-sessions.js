import { randomBytes } from "crypto";
import {
  hasBlobConfig,
  sanitizeDiagnosisPayload,
  saveLinkSession
} from "./_storage.js";

const SESSION_TTL_MS = 30 * 60 * 1000;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isLinkingEnabled() {
  return String(process.env.LINE_AI_PERSONAL_RESULT_LINKING || "").toLowerCase() === "true";
}

function isProduction() {
  return process.env.VERCEL_ENV === "production";
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8") || "{}");

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function buildSessionId() {
  return `ls_${randomBytes(24).toString("base64url")}`;
}

function ensureRuntimeConfig() {
  const missing = [];
  if (!isLinkingEnabled()) missing.push("LINE_AI_PERSONAL_RESULT_LINKING");
  if (!process.env.LIFF_ID) missing.push("LIFF_ID");
  if (!process.env.LINE_LOGIN_CHANNEL_ID) missing.push("LINE_LOGIN_CHANNEL_ID");
  if (!process.env.LINE_LOGIN_CHANNEL_SECRET) missing.push("LINE_LOGIN_CHANNEL_SECRET");
  if (!process.env.LINE_ADD_URL) missing.push("LINE_ADD_URL");
  if (!process.env.MOBBY_LINE_AI_SECRET) missing.push("MOBBY_LINE_AI_SECRET");
  if (isProduction() && !hasBlobConfig()) missing.push("BLOB_READ_WRITE_TOKEN");
  return missing;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const missing = ensureRuntimeConfig();
  if (missing.length) {
    return res.status(503).json({
      ok: false,
      error: "LINE AI personal result linking is not configured",
      missing
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const diagnosis = sanitizeDiagnosisPayload(body?.diagnosis || body);
  if (!diagnosis) {
    return res.status(400).json({ ok: false, error: "Unsupported or invalid diagnosis payload" });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  const sessionId = buildSessionId();
  const session = {
    version: 1,
    sessionId,
    diagnosis,
    pagePath: diagnosis.pagePath,
    createdAt: now.toISOString(),
    expiresAt,
    consumedAt: null
  };

  await saveLinkSession(sessionId, session);

  const liffId = String(process.env.LIFF_ID || "").trim();
  const liffUrl = `https://liff.line.me/${encodeURIComponent(liffId)}?s=${encodeURIComponent(sessionId)}`;
  return res.status(200).json({
    ok: true,
    sessionId,
    liffUrl,
    lineAddUrl: String(process.env.LINE_ADD_URL || "").trim(),
    expiresAt
  });
}
