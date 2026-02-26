import { upsertDiagnosisProfile } from "./_diagnosis-profiles.js";

export default async function handler(request, response) {
  // POST以外は拒否
  if (request.method !== "POST") {
    return response.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const gasUrl = process.env.GAS_WEBAPP_URL;
  const gasToken = process.env.GAS_TOKEN;

  // VercelのNode.js Functionsでは request.body が入る（JSONならオブジェクトで来る想定） :contentReference[oaicite:3]{index=3}
  let body = request.body;

  // まれに文字列で来るケースに備えて吸収
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ ok: false, error: "Invalid JSON body" });
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ ok: false, error: "Body must be a JSON object" });
  }

  let profileSaved = false;
  let detectedSource = "unknown";
  try {
    const profileResult = await upsertDiagnosisProfile(body);
    profileSaved = profileResult.ok === true;
    detectedSource = profileResult.source || detectedSource;
  } catch (profileError) {
    console.error("[DIAGNOSIS API] profile upsert failed:", profileError);
  }

  if (!gasUrl || !gasToken) {
    return response.status(200).json({
      ok: true,
      warning: "Missing GAS_WEBAPP_URL or GAS_TOKEN. Profile-only mode.",
      profileSaved,
      source: detectedSource
    });
  }

  // GASへ渡すpayload（tokenはサーバ側で付与するのでクライアントに出さない）
  const payload = { token: gasToken, ...body };

  try {
    const r = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();

    // GASからのJSONをそのまま返す（パースできなければ生テキストを返す）
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: r.ok, raw: text };
    }

    return response.status(r.ok ? 200 : 502).json({
      ...data,
      profileSaved,
      source: detectedSource
    });
  } catch (err) {
    return response.status(502).json({
      ok: false,
      error: String(err),
      profileSaved,
      source: detectedSource
    });
  }
}
