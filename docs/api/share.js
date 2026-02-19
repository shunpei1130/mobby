export default async function handler(req, res) {
  // request log
  console.log("[SHARE API] Request received:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

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
    const eventType = String(body.eventType || "").trim();
    const userId = String(body.userId || "").trim();
    const referrerId = String(body.referrerId || "").trim();
    const platform = String(body.platform || "").trim();
    const userType = String(body.userType || "").trim();
    const userName = String(body.userName || "").trim();
    const userEmail = String(body.userEmail || "").trim();
    const gender = String(body.gender || "").trim();
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    if (!eventType) {
      return res.status(400).json({ error: "eventType is required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const genderLabel = gender === "female" ? "female" : gender === "male" ? "male" : "";

    const graphData = {
      eventType,
      timestamp: createdAt,
      sharer: {
        id: eventType === "share" ? userId : referrerId,
        name: eventType === "share" ? userName : "",
        email: eventType === "share" ? userEmail : "",
        type: eventType === "share" ? userType : "",
        gender: eventType === "share" ? genderLabel : ""
      },
      recipient: eventType !== "share" ? {
        id: userId,
        name: userName,
        email: userEmail,
        type: userType,
        gender: genderLabel
      } : null,
      platform,
      edge: eventType === "referral_complete" ? `${referrerId} -> ${userId}` : null
    };

    console.log("[SHARE API] Email delivery disabled. Captured share event:", {
      eventType,
      userId,
      userName,
      userEmail,
      createdAt,
      graphData
    });

    return res.status(200).json({ ok: true, graphData, emailSent: false });
  } catch (e) {
    console.error("[SHARE API] Error occurred:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}