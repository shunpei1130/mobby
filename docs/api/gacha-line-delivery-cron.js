import { sendGachaResultLineMessage } from "./_gacha-line.js";
import {
  deleteStorageUrls,
  getStorageJson,
  listStorageBlobs,
  listStorageKeys,
  putStorageJson
} from "./_gacha-storage.js";

const RESULT_IMAGE_PREFIX = process.env.GACHA_RESULT_IMAGE_PREFIX || "result-images/";
const DRAW_RECORD_PREFIX = process.env.GACHA_DRAW_RECORD_PREFIX || "draw-records/";
const LINE_QUEUE_PREFIX = process.env.GACHA_LINE_QUEUE_PREFIX || "line-queue/";
const RETENTION_RULES = [
  { prefix: RESULT_IMAGE_PREFIX, days: 14 },
  { prefix: DRAW_RECORD_PREFIX, days: 30 },
  { prefix: LINE_QUEUE_PREFIX, days: 30 }
];

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
  const cleaned = [];

  try {
    const keys = await listStorageKeys(LINE_QUEUE_PREFIX, 1000);
    for (const key of keys) {
      try {
        const queue = await getStorageJson(key);
        if (!queue || queue.delivered) {
          skipped.push({ key, reason: "already_delivered" });
          continue;
        }
        if (Date.parse(queue.scheduled_at || "") > now) {
          skipped.push({ key, reason: "not_due" });
          continue;
        }

        const record = await getStorageJson(queue.record_key);
        if (!record || record.status !== "paid_result_fixed") {
          skipped.push({ key, reason: "record_not_ready" });
          continue;
        }
        if (record.line_delivery?.delivered) {
          await putStorageJson(key, { ...queue, delivered: true, delivered_at: record.line_delivery.delivered_at });
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
        await putStorageJson(queue.record_key, updatedRecord);
        await putStorageJson(key, { ...queue, delivered: true, delivered_at: deliveredAt });
        processed.push({ key, drawId: record.draw_id, count: imageItems.length });
      } catch (error) {
        failed.push({ key, error: error?.message || "delivery failed" });
      }
    }

    for (const rule of RETENTION_RULES) {
      const cutoff = now - rule.days * 24 * 60 * 60 * 1000;
      const expired = (await listStorageBlobs(rule.prefix, 1000)).filter((blob) => {
        const uploadedAt = blob.uploadedAt ? new Date(blob.uploadedAt).getTime() : now;
        return uploadedAt < cutoff;
      });
      if (!expired.length) continue;
      await deleteStorageUrls(expired.map((blob) => blob.url));
      cleaned.push({ prefix: rule.prefix, count: expired.length });
    }

    return res.status(200).json({ ok: true, processed, skipped, failed, cleaned });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || "Internal Error", processed, skipped, failed, cleaned });
  }
}
