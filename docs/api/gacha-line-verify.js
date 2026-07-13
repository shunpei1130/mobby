import { createLineLinkToken, verifyLineIdToken } from "./_gacha-line.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const profile = await verifyLineIdToken(req.body?.idToken);
    return res.status(200).json({
      ok: true,
      lineLinkToken: createLineLinkToken(profile.lineUserId),
      profile
    });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error?.message || "LINE verify failed" });
  }
}
