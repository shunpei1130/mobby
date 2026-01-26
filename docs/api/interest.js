import { Resend } from "resend";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";

const PASS_CODES = ["1130", "0811", "0823"];
const DEFAULT_BASE_HREF = "https://www.mobby.online/mypage/";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLines(lines) {
  if (!Array.isArray(lines)) return "";
  return lines.map((line) => escapeHtml(line)).join("<br>");
}

function renderChips(chips) {
  if (!Array.isArray(chips)) return "";
  return chips
    .filter((chip) => chip)
    .map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`)
    .join("");
}

function safeJson(data) {
  return JSON.stringify(data || {}).replaceAll("<", "\\u003c");
}

function applyTemplate(template, map) {
  let output = template;
  Object.entries(map).forEach(([key, value]) => {
    output = output.replaceAll(`{{${key}}}`, value ?? "");
  });
  return output;
}

function pickPassCode() {
  return PASS_CODES[Math.floor(Math.random() * PASS_CODES.length)];
}

function resolveOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return "https://www.mobby.online";
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "").trim();
    const gender = String(body.gender || "").trim();
    const axes = body.axes || {};
    const answers = body.answers || {};
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();
    const page = body.page || {};

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!email) return res.status(400).json({ error: "email is required" });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ error: "email is invalid" });
    if (!type) return res.status(400).json({ error: "type is required" });

    const resendKey = process.env.RESEND_API_KEY_PAGE || process.env.RESEND_API_KEY;
    if (!resendKey) {
      return res.status(500).json({ error: "RESEND_API_KEY_PAGE is missing" });
    }

    const pageId = randomUUID().replaceAll("-", "").slice(0, 16);
    const passCode = pickPassCode();
    const baseHref = String(process.env.MYPAGE_BASE_HREF || DEFAULT_BASE_HREF).trim();
    const userIdLabel = pageId.toUpperCase();

    const leadTitle = String(page.leadTitle || type).trim();
    const typeLabel = String(page.typeLabel || type).trim();
    const heroLines = Array.isArray(page.heroLines) ? page.heroLines : [];
    const chips = Array.isArray(page.chips) ? page.chips : [];
    const quoteLines = Array.isArray(page.quoteLines) ? page.quoteLines : [];
    const storyLines = Array.isArray(page.storyLines) ? page.storyLines : [];
    const collectionLines = Array.isArray(page.collectionLines) ? page.collectionLines : [];

    const templateUrl = new URL("../mypage/template.html", import.meta.url);
    const template = await readFile(templateUrl, "utf8");

    const diagnosisPayload = {
      name,
      email,
      type,
      gender,
      axes,
      answers,
      createdAt,
      userId: body.userId || "",
      referrerId: body.referrerId || "",
      shareCount: Number(body.shareCount || 0),
      pageId,
      passCode,
      leadTitle
    };

    const html = applyTemplate(template, {
      USER_NAME: escapeHtml(name),
      USER_NAME_UPPER: escapeHtml(name.toUpperCase()),
      USER_ID: escapeHtml(userIdLabel),
      LEAD_TITLE: escapeHtml(leadTitle),
      TYPE_LABEL: escapeHtml(typeLabel),
      HERO_COPY: renderLines(heroLines),
      CHIPS_HTML: renderChips(chips),
      QUOTE_HTML: renderLines(quoteLines),
      STORY_COPY: renderLines(storyLines),
      COLLECTION_COPY: renderLines(collectionLines),
      DIAGNOSIS_JSON: safeJson(diagnosisPayload),
      PASS_CODE: escapeHtml(passCode),
      BASE_HREF: escapeHtml(baseHref)
    });

    const blob = await put(`mypage/${pageId}.html`, html, {
      access: "public",
      addRandomSuffix: false,
      contentType: "text/html; charset=utf-8"
    });

    const origin = resolveOrigin(req);
    const viewerUrl = `${origin}/api/mypage?u=${encodeURIComponent(blob.url)}&id=${encodeURIComponent(pageId)}`;

    const resend = new Resend(resendKey);
    const sendAt = new Date(Date.now() + 60 * 1000);
    const subject = `【学校キャラ診断】${name}さん専用ページのご案内`;
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#ff4d8d;">${escapeHtml(name)}さん専用ページをお届けします</h2>
        <p>診断結果をもとに、${escapeHtml(leadTitle)}の世界観をまとめたページを用意しました。</p>
        <p><strong>パスコード:</strong> ${escapeHtml(passCode)}</p>
        <p style="margin:24px 0;">
          <a href="${viewerUrl}" style="background:#ff4d8d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            専用ページを開く
          </a>
        </p>
        <p style="font-size:12px;color:#666;">このメールは診断の「興味あり」を押した方に送信されています。</p>
      </div>
    `;
    const textBody = [
      `${name}さん専用ページをお届けします`,
      `診断結果をもとに、${leadTitle}の世界観をまとめたページを用意しました。`,
      `パスコード: ${passCode}`,
      `URL: ${viewerUrl}`
    ].join("\n");

    await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || "学校キャラ診断 <onboarding@resend.dev>",
      to: email,
      subject,
      html: htmlBody,
      text: textBody,
      scheduledAt: sendAt.toISOString()
    });

    return res.status(200).json({
      ok: true,
      pageId,
      scheduledAt: sendAt.toISOString(),
      viewerUrl
    });
  } catch (e) {
    console.error("[INTEREST API] Error:", e?.message);
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
