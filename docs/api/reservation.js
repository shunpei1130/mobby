// /api/reservation.js
import { Resend } from "resend";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    // リクエストボディの確認
    if (!req.body) {
      res.status(400).json({ ok: false, error: "Request body is missing" });
      return;
    }

    const { address, name, age, email, phone, purchaseReason, pricePrediction, productType, productLabel, hp } = req.body;

    if (hp) {
      res.status(200).json({ ok: true });
      return;
    }

    // 住所のバリデーション
    if (!address) {
      res.status(400).json({ ok: false, error: "Address is required" });
      return;
    }
    if (typeof address !== "string") {
      res.status(400).json({ ok: false, error: "Address must be a string" });
      return;
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 5) {
      res.status(400).json({ ok: false, error: "Address must be at least 5 characters" });
      return;
    }
    if (trimmedAddress.length > 2000) {
      res.status(400).json({ ok: false, error: "Address must be at most 2000 characters" });
      return;
    }

    // 名前のバリデーション（必須）
    if (!name) {
      res.status(400).json({ ok: false, error: "Name is required" });
      return;
    }
    if (typeof name !== "string") {
      res.status(400).json({ ok: false, error: "Name must be a string" });
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      res.status(400).json({ ok: false, error: "Name cannot be empty" });
      return;
    }
    if (trimmedName.length > 200) {
      res.status(400).json({ ok: false, error: "Name must be at most 200 characters" });
      return;
    }

    // 年齢のバリデーション（必須）
    if (age === undefined || age === null || String(age).trim().length === 0) {
      res.status(400).json({ ok: false, error: "Age is required" });
      return;
    }
    const normalizedAge = String(age).trim();
    if (!/^\d{1,3}$/.test(normalizedAge)) {
      res.status(400).json({ ok: false, error: "Invalid age" });
      return;
    }
    const numericAge = Number(normalizedAge);
    if (!Number.isInteger(numericAge) || numericAge < 0 || numericAge > 120) {
      res.status(400).json({ ok: false, error: "Invalid age" });
      return;
    }

    // 任意項目の軽い制限
    const safeName = trimmedName.slice(0, 200);
    const safeAge = String(numericAge);
    const safeEmail = (typeof email === "string" ? email : "").slice(0, 200);
    const safePhone = (typeof phone === "string" ? phone : "").slice(0, 50);
    const safePurchaseReason = Array.isArray(purchaseReason) ? purchaseReason : (purchaseReason ? [purchaseReason] : []);
    const safePricePrediction = (typeof pricePrediction === "string" ? pricePrediction : "").slice(0, 50);
    const rawProductType = typeof productType === "string" ? productType.trim().toLowerCase() : "";
    const safeProductType = rawProductType === "acrylic_keyholder" ? "acrylic_keyholder" : "camera_keyholder";
    const fallbackLabel = safeProductType === "acrylic_keyholder" ? "アクリルキーホルダー" : "カメラ型キーホルダー";
    const safeProductLabel = (typeof productLabel === "string" ? productLabel.trim() : "").slice(0, 80) || fallbackLabel;
    const createdAt = new Date().toISOString();
    const reservationId = randomUUID().replaceAll("-", "");
    const reservationRecord = {
      reservationId,
      createdAt,
      productType: safeProductType,
      productLabel: safeProductLabel,
      address: trimmedAddress,
      name: safeName,
      age: safeAge || "",
      email: safeEmail || "",
      phone: safePhone || "",
      purchaseReason: safePurchaseReason,
      pricePrediction: safePricePrediction || ""
    };
    const timestamp = createdAt.replaceAll(":", "-").replaceAll(".", "-");
    const blobPath = `reservations/${timestamp}_${reservationId}.json`;

    const blob = await put(blobPath, JSON.stringify(reservationRecord), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json; charset=utf-8"
    });
    console.log("[RESERVATION API] Saved reservation", { path: blob.pathname });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.RESERVATION_TO_EMAIL || process.env.TO_EMAIL;
    const from = process.env.RESERVATION_FROM_EMAIL || process.env.FROM_EMAIL;

    if (!to || !from) {
      res.status(500).json({ ok: false, error: "Server env not set" });
      return;
    }

    const purchaseReasonText = safePurchaseReason.length > 0 
      ? safePurchaseReason.join("、") 
      : "(未入力)";
    const pricePredictionText = safePricePrediction ? safePricePrediction : "(未入力)";

    await resend.emails.send({
      from,
      to: [to],
      subject: `【Mobby】${safeProductLabel} 抽選予約（住所入力）`,
      text:
        `抽選予約が届きました。\n\n` +
        `予約タイプ: ${safeProductLabel}\n` +
        `住所:\n${trimmedAddress}\n\n` +
        `名前: ${safeName}\n` +
        `年齢: ${safeAge || "(未入力)"}\n` +
        `メール: ${safeEmail || "(未入力)"}\n` +
        `電話: ${safePhone || "(未入力)"}\n` +
        `購入理由: ${purchaseReasonText}\n` +
        `値段予想: ${pricePredictionText}\n`
    });
    console.log("[RESERVATION API] Email sent successfully", { to, from });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Reservation API error:", e);
    res.status(500).json({ ok: false, error: "Internal Error", details: e.message });
  }
}
