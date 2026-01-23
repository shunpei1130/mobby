// /api/contact.js
const { Resend } = require("resend");

function pickFirstIp(xff) {
  if (!xff) return "";
  return String(xff).split(",")[0].trim();
}

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const { email, message, hp } = req.body || {};

    // Honeypot (bot対策): hpに値が入ってたら捨てる
    if (hp) {
      res.status(200).json({ ok: true });
      return;
    }

    if (!email || typeof email !== "string" || email.length > 200) {
      res.status(400).json({ ok: false, error: "Invalid email" });
      return;
    }
    if (!message || typeof message !== "string" || message.length < 2 || message.length > 5000) {
      res.status(400).json({ ok: false, error: "Invalid message" });
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const to = process.env.TO_EMAIL; // 受信先
    const from = process.env.FROM_EMAIL; // 例: "Mobby <noreply@mobby.xxx>"

    if (!to || !from) {
      res.status(500).json({ ok: false, error: "Server env not set" });
      return;
    }

    const ip = pickFirstIp(req.headers["x-forwarded-for"]) || req.socket?.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";

    await resend.emails.send({
      from,
      to: [to],
      subject: "【Mobby】お問い合わせ",
      text:
        `お問い合わせが届きました。\n\n` +
        `from: ${email}\n` +
        `ip: ${ip}\n` +
        `ua: ${ua}\n\n` +
        `---\n` +
        `${message}\n`
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Internal Error" });
  }
};
