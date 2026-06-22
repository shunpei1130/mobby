import { sendGachaResultLineMessage } from "./_gacha-line.js";
import { getR2Json, listR2Keys, putR2Json } from "./_r2.js";

const LINE_QUEUE_PREFIX = process.env.R2_LINE_QUEUE_PREFIX || "line-queue/";

function assertCronAuth(req) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return true;
  return req.headers.authorization === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  if (!assertCronAuth(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const now = Date.now();
  const processed = [];
  const skipped = [];
  const failed = [];

  try {
    const keys = await listR2Keys(LINE_QUEUE_PREFIX, 1000);
    for (const key of keys) {
      try {
        const queue = await getR2Json(key);
        if (!queue || queue.delivered) {
          skipped.push({ key, reason: "already_delivered" });
          continue;
        }
        if (Date.parse(queue.scheduled_at || "") > now) {
          skipped.push({ key, reason: "not_due" });
          continue;
        }

        const record = await getR2Json(queue.record_key);
        if (!record || record.status !== "paid_result_fixed") {
          skipped.push({ key, reason: "record_not_ready" });
          continue;
        }
        if (record.line_delivery?.delivered) {
          await putR2Json(key, { ...queue, delivered: true, delivered_at: record.line_delivery.delivered_at });
          skipped.push({ key, reason: "record_already_delivered" });
          continue;
        }

        const imageItems = (record.sheet_images || []).filter((image) => image?.url);
        await sendGachaResultLineMessage({
          lineUserId: record.line_user_id,
          drawId: record.draw_id,
          imageItems
        });

        const deliveredAt = new Date().toISOString();
        const updatedRecord = {
          ...record,
          line_delivery: {
            ...(record.line_delivery || {}),
            delivered: true,
            delivered_at: deliveredAt,
            error: ""
          }
        };
        await putR2Json(queue.record_key, updatedRecord);
        await putR2Json(key, { ...queue, delivered: true, delivered_at: deliveredAt });
        processed.push({ key, drawId: record.draw_id, count: imageItems.length });
      } catch (error) {
        failed.push({ key, error: error?.message || "delivery failed" });
      }
    }

    return res.status(200).json({ ok: true, processed, skipped, failed });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || "Internal Error", processed, skipped, failed });
  }
}
