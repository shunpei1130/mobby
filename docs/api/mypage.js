function isAllowedBlobUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch (_) {
    return false;
  }
}

function patchLegacyRegexBug(html) {
  const broken = "const match = html.match(/<script type=\"application\\\\/json\" id=\"mobbyProfileData\">([\\\\s\\\\S]*?)<\\\\/script>/i);";
  const fixed = "const match = html.match(/<script type=\"application\\/json\" id=\"mobbyProfileData\">([\\s\\S]*?)<\\/script>/i);";
  if (!html.includes(broken)) return html;
  return html.replace(broken, fixed);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const blobUrl = url.searchParams.get("u");
  const pageId = url.searchParams.get("id") || "unknown";

  if (!blobUrl || !isAllowedBlobUrl(blobUrl)) {
    return res.status(400).json({ error: "invalid blob url" });
  }

  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      return res.status(502).json({ error: "failed to fetch page" });
    }
    const html = patchLegacyRegexBug(await response.text());
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).end(html);
  } catch (e) {
    console.error("[MYPAGE API] Error:", pageId, e?.message);
    return res.status(500).json({ error: "internal error" });
  }
}
