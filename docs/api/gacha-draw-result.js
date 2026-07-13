import { loadGachaDrawRecord, safeText } from "./_gacha-paid-result.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const drawId = safeText(req.method === "GET" ? req.query?.draw_id : req.body?.drawId, 120);
    if (!drawId || !drawId.startsWith("draw_")) {
      return res.status(400).json({ ok: false, error: "draw_id is invalid" });
    }

    const record = await loadGachaDrawRecord(drawId);
    if (!record) {
      return res.status(200).json({ ok: true, status: "pending", resultReady: false });
    }

    return res.status(200).json({
      ok: true,
      status: record.status || "pending",
      resultReady: record.status === "paid_result_fixed",
      draw: record.status === "paid_result_fixed" ? {
        drawId: record.draw_id,
        pulls: record.pulls,
        results: record.results || [],
        sheetImages: record.sheet_images || [],
        lineDelivery: record.line_delivery || {}
      } : null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || "Internal Error" });
  }
}
