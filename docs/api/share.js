import { Resend } from "resend";

export default async function handler(req, res) {
  // ログ: リクエスト情報
  console.log("[SHARE API] Request received:", {
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
    console.log("[SHARE API] OPTIONS request handled");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error("[SHARE API] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    console.log("[SHARE API] Request body:", JSON.stringify(body, null, 2));

    // 共有イベントデータ
    const eventType = String(body.eventType || "").trim(); // "share" | "referral_visit" | "referral_complete"
    const userId = String(body.userId || "").trim();       // 共有者のユーザーID
    const referrerId = String(body.referrerId || "").trim(); // 紹介者のID（訪問時）
    const platform = String(body.platform || "").trim();   // "line" | "twitter" | "copy" | "other"
    const userType = String(body.userType || "").trim();   // 診断結果タイプ
    const userName = String(body.userName || "").trim();   // ユーザー名
    const userEmail = String(body.userEmail || "").trim(); // ユーザーメール
    const gender = String(body.gender || "").trim();       // 性別
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    // バリデーション
    if (!eventType) {
      console.error("[SHARE API] Validation error: eventType is required");
      return res.status(400).json({ error: "eventType is required" });
    }
    if (!userId) {
      console.error("[SHARE API] Validation error: userId is required");
      return res.status(400).json({ error: "userId is required" });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_TO_EMAIL || "info.mobbymobbymobby@gmail.com";
    const from = process.env.LEAD_FROM_EMAIL || "学校キャラ診断 <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("[SHARE API] RESEND_API_KEY is missing");
      return res.status(500).json({ error: "RESEND_API_KEY is missing" });
    }

    console.log("[SHARE API] Sending email via Resend...");
    const resend = new Resend(resendKey);

    // イベントタイプに応じた件名
    let subject = "";
    let emoji = "";
    switch(eventType) {
      case "share":
        emoji = "📤";
        subject = `【共有】${emoji} ${userName || userId} が ${platform} で共有しました`;
        break;
      case "referral_visit":
        emoji = "👋";
        subject = `【紹介訪問】${emoji} ${userId} が ${referrerId} の紹介で訪問`;
        break;
      case "referral_complete":
        emoji = "🎉";
        subject = `【紹介完了】${emoji} ${userName || userId} が ${referrerId} の紹介で診断完了`;
        break;
      default:
        emoji = "📊";
        subject = `【共有イベント】${emoji} ${eventType} by ${userId}`;
    }

    const genderLabel = gender === "female" ? "女子版" : gender === "male" ? "男子版" : "";
    
    // 繋がりグラフ用のデータ構造
    const graphData = {
      eventType,
      timestamp: createdAt,
      sharer: {
        id: eventType === "share" ? userId : referrerId,
        name: eventType === "share" ? userName : "",
        email: eventType === "share" ? userEmail : "",
        type: eventType === "share" ? userType : "",
        gender: eventType === "share" ? gender : ""
      },
      recipient: eventType !== "share" ? {
        id: userId,
        name: userName,
        email: userEmail,
        type: userType,
        gender
      } : null,
      platform,
      edge: eventType === "referral_complete" ? `${referrerId} -> ${userId}` : null
    };

    const text = [
      `===== 共有イベント記録 =====`,
      `イベント種別: ${eventType}`,
      `タイムスタンプ: ${createdAt}`,
      ``,
      `--- 共有者情報 ---`,
      `ユーザーID: ${userId}`,
      userName ? `名前: ${userName}` : null,
      userEmail ? `メール: ${userEmail}` : null,
      userType ? `診断タイプ: ${userType} ${genderLabel}` : null,
      ``,
      eventType !== "share" && referrerId ? [
        `--- 紹介関係 ---`,
        `紹介者ID: ${referrerId}`,
        `被紹介者ID: ${userId}`,
        `エッジ: ${referrerId} -> ${userId}`,
      ].join("\n") : null,
      ``,
      platform ? `共有プラットフォーム: ${platform}` : null,
      ``,
      `===== グラフデータ（JSON） =====`,
      JSON.stringify(graphData, null, 2),
      ``,
      `===== 生データ =====`,
      JSON.stringify(body, null, 2),
    ].filter(Boolean).join("\n");

    const emailResult = await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: userEmail || undefined
    });

    console.log("[SHARE API] Email sent successfully:", emailResult);

    return res.status(200).json({ ok: true, graphData });
  } catch (e) {
    console.error("[SHARE API] Error occurred:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
