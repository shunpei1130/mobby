import { Resend } from "resend";

export default async function handler(req, res) {
  // CORS対応
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
    const pageId = String(body.pageId || "").trim();
    const userName = String(body.userName || "").trim();
    const accessTime = String(body.accessTime || new Date().toISOString()).trim();
    const referrer = String(body.referrer || "").trim();
    const userAgent = String(body.userAgent || "").trim();

    const resendKey = process.env.RESEND_API_KEY_NOTIFY || process.env.RESEND_API_KEY;
    const to = process.env.NOTIFY_TO_EMAIL || "info@mobby.online";
    const from = process.env.NOTIFY_FROM_EMAIL || "Mobby通知 <notify@mobby.online>";

    if (!resendKey) {
      console.error("[NOTIFY API] RESEND_API_KEY is missing");
      return res.status(500).json({ error: "RESEND_API_KEY is missing" });
    }

    const resend = new Resend(resendKey);

    const subject = `📱 マイページアクセス: ${userName || pageId}`;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#ff4d8d;">🎀 マイページにアクセスがありました</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">ページID</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${pageId || '不明'}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">ユーザー名</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${userName || '不明'}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">アクセス日時</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${accessTime}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">リファラー</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${referrer || 'なし'}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">ブラウザ</td>
            <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${userAgent || '不明'}</td>
          </tr>
        </table>
        <p style="margin-top:20px;color:#666;font-size:12px;">Mobbyマイページ自動通知</p>
      </div>
    `;

    await resend.emails.send({ from, to, subject, html });

    console.log(`[NOTIFY API] Notification sent for ${pageId} (${userName})`);
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("[NOTIFY API] Error:", e?.message);
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
