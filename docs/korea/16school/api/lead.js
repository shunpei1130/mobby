export default async function handler(req, res) {
  console.log("[LEAD API] Request received:", {
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
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "").trim();
    const axes = body.axes || {};
    const answers = body.answers || {};
    const gender = String(body.gender || "").trim();
    const interested = body.interested === true;
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!email) return res.status(400).json({ error: "email is required" });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ error: "email is invalid" });
    if (!type) return res.status(400).json({ error: "type is required" });

    console.log("[LEAD API] Email delivery disabled. Captured payload:", {
      name,
      email,
      type,
      axes,
      answers,
      gender,
      interested,
      createdAt
    });

    return res.status(200).json({ ok: true, emailSent: false });
  } catch (e) {
    console.error("[LEAD API] Error occurred:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
