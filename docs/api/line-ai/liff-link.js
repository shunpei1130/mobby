import { createHash } from "crypto";
import {
  hasBlobConfig,
  loadLinkSession,
  loadUser,
  mergePersonalDiagnosisResult,
  saveLinkSession,
  saveUser,
  sanitizeDiagnosisPayload
} from "./_storage.js";

const LINE_ID_TOKEN_VERIFY_ENDPOINT = "https://api.line.me/oauth2/v2.1/verify";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isLinkingEnabled() {
  return String(process.env.LINE_AI_PERSONAL_RESULT_LINKING || "").toLowerCase() === "true";
}

function isProduction() {
  return process.env.VERCEL_ENV === "production";
}

function userKeyFromLineId(lineUserId) {
  const secret = process.env.MOBBY_LINE_AI_SECRET;
  if (!secret) throw new Error("MOBBY_LINE_AI_SECRET is not configured");
  return createHash("sha256").update(`${lineUserId}:${secret}`).digest("hex");
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

function getMissingRuntimeConfig() {
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

function isValidSessionId(sessionId) {
  return /^ls_[A-Za-z0-9_-]{24,}$/.test(String(sessionId || ""));
}

async function verifyLineIdToken(idToken) {
  const clientId = String(process.env.LINE_LOGIN_CHANNEL_ID || "").trim();
  const response = await fetch(LINE_ID_TOKEN_VERIFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: clientId
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error("LINE ID token verification failed");
    error.status = response.status || 401;
    error.body = text.slice(0, 200);
    throw error;
  }

  const payload = await response.json();
  if (payload?.aud !== clientId) {
    const error = new Error("LINE ID token audience mismatch");
    error.status = 401;
    throw error;
  }
  if (!payload?.sub) {
    const error = new Error("LINE ID token subject is missing");
    error.status = 401;
    throw error;
  }
  return payload;
}

function sendConfig(res) {
  const missing = getMissingRuntimeConfig();
  if (missing.length) {
    return res.status(503).json({
      ok: false,
      error: "LINE AI personal result linking is not configured",
      missing
    });
  }

  return res.status(200).json({
    ok: true,
    liffId: String(process.env.LIFF_ID || "").trim(),
    lineAddUrl: String(process.env.LINE_ADD_URL || "").trim()
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method === "GET") {
    return sendConfig(res);
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const missing = getMissingRuntimeConfig();
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

  const sessionId = String(body?.sessionId || "").trim();
  const idToken = String(body?.idToken || "").trim();
  if (!isValidSessionId(sessionId) || !idToken || idToken.length > 8192) {
    return res.status(400).json({ ok: false, error: "Invalid link request" });
  }

  const session = await loadLinkSession(sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, error: "Link session not found" });
  }
  if (session.consumedAt) {
    return res.status(409).json({ ok: false, error: "Link session has already been used" });
  }
  if (!session.expiresAt || Date.parse(session.expiresAt) <= Date.now()) {
    return res.status(410).json({ ok: false, error: "Link session has expired" });
  }

  const diagnosis = sanitizeDiagnosisPayload(session.diagnosis);
  if (!diagnosis) {
    return res.status(400).json({ ok: false, error: "Link session diagnosis is invalid" });
  }

  let verified;
  try {
    verified = await verifyLineIdToken(idToken);
  } catch (error) {
    return res.status(error?.status || 401).json({ ok: false, error: "Invalid LINE ID token" });
  }

  const linkedAt = new Date().toISOString();
  const userKey = userKeyFromLineId(verified.sub);
  const existingUser = await loadUser(userKey);
  const nextUser = mergePersonalDiagnosisResult(existingUser, diagnosis, { userKey, linkedAt });
  await saveUser(userKey, nextUser);
  await saveLinkSession(sessionId, {
    ...session,
    diagnosis,
    consumedAt: linkedAt
  });

  return res.status(200).json({
    ok: true,
    linked: true,
    resultName: diagnosis.resultName,
    sourceLabel: diagnosis.sourceLabel,
    lineAddUrl: String(process.env.LINE_ADD_URL || "").trim()
  });
}
