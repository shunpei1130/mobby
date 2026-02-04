import { list } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  try {
    let cursor;
    let total = 0;
    const MANUAL_ADD = 79;

    do {
      const page = await list({ prefix: "reservations/", cursor, limit: 1000 });
      total += page.blobs.length;
      cursor = page.cursor;
      if (!page.hasMore) break;
    } while (true);

    res.status(200).json({ ok: true, count: total + MANUAL_ADD });
  } catch (e) {
    console.error("[RESERVATION COUNT] error", e);
    res.status(500).json({ ok: false, error: "Internal Error" });
  }
}
