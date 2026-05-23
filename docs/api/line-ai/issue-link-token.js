import { randomBytes } from "crypto";
import { getSourceMeta } from "./_prompts.js";
import { loadToken, saveToken } from "./_storage.js";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body && typeof req.body === "object" ? req.body : null;
}

function cleanText(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanDiagnosis(input) {
  const source = cleanText(input?.source, 32);
  const meta = getSourceMeta(source);
  if (!meta) return { error: "invalid_source" };

  const pagePath = cleanText(input?.pagePath, 80);
  if (pagePath !== meta.pagePath) return { error: "invalid_page_path" };

  const resultName = cleanText(input?.resultName, 120);
  if (!resultName) return { error: "resultName is required" };

  const traits = Array.isArray(input?.traits)
    ? input.traits.map((trait) => cleanText(trait, 120)).filter(Boolean).slice(0, 8)
    : [];

  return {
    diagnosis: {
      source,
      sourceLabel: cleanText(input?.sourceLabel, 80) || meta.label,
      resultId: cleanText(input?.resultId, 80) || resultName,
      resultName,
      resultSummary: cleanText(input?.resultSummary, 600),
      traits,
      pagePath,
      createdAt: cleanText(input?.createdAt, 48) || new Date().toISOString()
    }
  };
}

function generateToken() {
  const bytes = randomBytes(6);
  let body = "";
  for (const byte of bytes) {
    body += TOKEN_CHARS[byte % TOKEN_CHARS.length];
  }
  return `MB-${body}`;
}

async function generateUniqueToken() {
  for (let i = 0; i < 8; i += 1) {
    const token = generateToken();
    const existing = await loadToken(token);
    if (!existing) return token;
  }
  throw new Error("Failed to issue unique token");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const lineAddUrl = String(process.env.LINE_ADD_URL || "").trim();
  if (!lineAddUrl) {
    return res.status(500).json({ ok: false, error: "LINE_ADD_URL is not configured" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const cleaned = cleanDiagnosis(body.diagnosis);
  if (cleaned.error) {
    return res.status(400).json({ ok: false, error: cleaned.error });
  }

  try {
    const token = await generateUniqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
    const firstMessageText = `モビー登録 ${token}`;

    await saveToken(token, {
      version: 1,
      token,
      status: "pending",
      diagnosis: cleaned.diagnosis,
      createdAt: now.toISOString(),
      expiresAt,
      usedAt: "",
      userKey: ""
    });

    return res.status(200).json({
      ok: true,
      token,
      expiresAt,
      lineAddUrl,
      firstMessageText
    });
  } catch (error) {
    console.error("[LINE AI ISSUE TOKEN] error:", error);
    return res.status(500).json({ ok: false, error: "Internal Error" });
  }
}
