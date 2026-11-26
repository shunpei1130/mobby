import { Resend } from "resend";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "35mb"
    }
  }
};

const MAX_ATTACHMENTS = 10;
const MAX_BASE64_CHARS_PER_FILE = 7_500_000;

function normalizeEmail(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeFileName(value, index) {
  const fallback = `mobby-sticker-sheet-${String(index + 1).padStart(2, "0")}.webp`;
  const fileName = String(value || fallback).replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
  return fileName.endsWith(".webp") ? fileName : `${fileName}.webp`;
}

function formatFrom(value) {
  const from = String(value || "").trim();
  if (!from) return "";
  return from.includes("<") ? from : `Mobby <${from}>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    if (body.hp) {
      return res.status(200).json({ ok: true });
    }

    const email = normalizeEmail(body.email);
    if (!email || email.length > 200 || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!rawAttachments.length || rawAttachments.length > MAX_ATTACHMENTS) {
      return res.status(400).json({ ok: false, error: "Invalid attachments" });
    }

    const attachments = rawAttachments.map((item, index) => {
      const content = String(item?.content || "");
      if (!/^[A-Za-z0-9+/=]+$/.test(content) || content.length > MAX_BASE64_CHARS_PER_FILE) {
        throw new Error("Invalid attachment content");
      }

      return {
        filename: safeFileName(item?.fileName, index),
        content: Buffer.from(content, "base64"),
        contentType: "image/webp"
      };
    });

    const resendKey = process.env.RESEND_API_KEY;
    const from = formatFrom(process.env.GACHA_STICKER_FROM_EMAIL || process.env.FROM_EMAIL);
    if (!resendKey || !from) {
      return res.status(500).json({ ok: false, error: "Server env not set" });
    }

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from,
      to: [email],
      subject: "Mobbyシールガチャの結果です",
      text: "モビーシールガチャの結果画像をお送りします。",
      attachments
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[GACHA SEND STICKER EMAIL] Error:", error);
    return res.status(500).json({ ok: false, error: "Internal Error" });
  }
}
