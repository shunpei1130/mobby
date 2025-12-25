// /api/reservation.js
const { Resend } = require("resend");

module.exports = async (req, res) => {
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

    const { address, name, email, phone, purchaseReason, hp } = req.body;

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

    // 任意項目の軽い制限
    const safeName = trimmedName.slice(0, 200);
    const safeEmail = (typeof email === "string" ? email : "").slice(0, 200);
    const safePhone = (typeof phone === "string" ? phone : "").slice(0, 50);
    const safePurchaseReason = Array.isArray(purchaseReason) ? purchaseReason : (purchaseReason ? [purchaseReason] : []);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!to || !from) {
      res.status(500).json({ ok: false, error: "Server env not set" });
      return;
    }

    const purchaseReasonText = safePurchaseReason.length > 0 
      ? safePurchaseReason.join("、") 
      : "(未入力)";

    await resend.emails.send({
      from,
      to: [to],
      subject: "【Mobby】抽選予約（住所入力）",
      text:
        `抽選予約が届きました。\n\n` +
        `住所:\n${trimmedAddress}\n\n` +
        `名前: ${safeName}\n` +
        `メール: ${safeEmail || "(未入力)"}\n` +
        `電話: ${safePhone || "(未入力)"}\n` +
        `購入理由: ${purchaseReasonText}\n`
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Reservation API error:", e);
    res.status(500).json({ ok: false, error: "Internal Error", details: e.message });
  }
};
