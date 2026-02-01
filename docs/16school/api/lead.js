import { Resend } from "resend";

export default async function handler(req, res) {
  // ログ: リクエスト情報
  console.log("[LEAD API] Request received:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // CORS対応
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("[LEAD API] OPTIONS request handled");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error("[LEAD API] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Vercelではreq.bodyが既にパースされている場合がある
    const body = req.body || {};
    console.log("[LEAD API] Request body:", JSON.stringify(body, null, 2));

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "").trim();
    const axes = body.axes || {};
    const answers = body.answers || {};  // 各質問の回答データ
    const gender = String(body.gender || "").trim();  // 性別（"male" または "female"）
    const interested = body.interested === true;  // モビーが欲しい！ボタンが押されたか
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    console.log("[LEAD API] Parsed data:", { name, email, type, axes, answers, gender, interested, createdAt });

    if (!name) {
      console.error("[LEAD API] Validation error: name is required");
      return res.status(400).json({ error: "name is required" });
    }
    if (!email) {
      console.error("[LEAD API] Validation error: email is required");
      return res.status(400).json({ error: "email is required" });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      console.error("[LEAD API] Validation error: email is invalid", email);
      return res.status(400).json({ error: "email is invalid" });
    }
    if (!type) {
      console.error("[LEAD API] Validation error: type is required");
      return res.status(400).json({ error: "type is required" });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_TO_EMAIL || "info.mobbymobbymobby@gmail.com";
    const from = process.env.LEAD_FROM_EMAIL || "Shukatsu診断 <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("[LEAD API] RESEND_API_KEY is missing");
      return res.status(500).json({ error: "RESEND_API_KEY is missing" });
    }

    console.log("[LEAD API] Sending email via Resend...");
    const resend = new Resend(resendKey);

    const genderLabel = gender === "female" ? "女子版" : gender === "male" ? "男子版" : "";
    const interestLabel = interested ? "【🎁 このモビーが欲しい！】" : "";
    const diagTitle = String(body.diagTitle || "学校キャラ診断").trim();
    const subject = `【${diagTitle}】${interestLabel}${name} / ${email} / ${type} ${genderLabel}`;
    
    // 回答データを整形（見やすく）
    const answersText = Object.entries(answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([qid, val]) => `  ${qid}: ${val}`)
      .join("\n");
    
    const text = [
      `createdAt: ${createdAt}`,
      `name: ${name}`,
      `email: ${email}`,
      `type: ${type}`,
      `gender: ${gender} ${genderLabel}`,
      interested ? `興味度: ★★★ このモビーのぬいぐるみが欲しい！` : `興味度: 診断のみ`,
      `axes: ${JSON.stringify(axes)}`,
      "",
      "【各質問の回答（1-7の7段階）】",
      answersText,
      "",
      "raw:",
      JSON.stringify(body, null, 2),
    ].join("\n");

    const emailResult = await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: email
    });

    console.log("[LEAD API] Email sent successfully:", emailResult);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[LEAD API] Error occurred:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
