// /api/reservation.js
const { Resend } = require("resend");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const { address, name, email, phone, hp } = req.body || {};

    if (hp) {
      res.status(200).json({ ok: true });
      return;
    }

    if (!address || typeof address !== "string" || address.length < 5 || address.length > 2000) {
      res.status(400).json({ ok: false, error: "Invalid address" });
      return;
    }

    // 任意項目の軽い制限
    const safeName = (typeof name === "string" ? name : "").slice(0, 200);
    const safeEmail = (typeof email === "string" ? email : "").slice(0, 200);
    const safePhone = (typeof phone === "string" ? phone : "").slice(0, 50);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!to || !from) {
      res.status(500).json({ ok: false, error: "Server env not set" });
      return;
    }

    await resend.emails.send({
      from,
      to: [to],
      subject: "【Mobby】抽選予約（住所入力）",
      text:
        `抽選予約が届きました。\n\n` +
        `住所:\n${address}\n\n` +
        `名前: ${safeName || "(未入力)"}\n` +
        `メール: ${safeEmail || "(未入力)"}\n` +
        `電話: ${safePhone || "(未入力)"}\n`
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Internal Error" });
  }
};
