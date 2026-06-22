import { del, list, put } from "@vercel/blob";

const memoryObjects = globalThis.__mobbyGachaStorageMemoryObjects || new Map();
globalThis.__mobbyGachaStorageMemoryObjects = memoryObjects;

export function hasGachaStorageConfig() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function assertStorageConfig() {
  if (!hasGachaStorageConfig() && isVercelRuntime()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
}

function normalizeKey(key) {
  return String(key || "").trim().replace(/^\/+/u, "");
}

function cloneBuffer(value) {
  return Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(value || "");
}

async function findBlob(key) {
  const pathname = normalizeKey(key);
  let cursor;
  do {
    const page = await list({ prefix: pathname, cursor, limit: 1000 });
    const match = (page.blobs || []).find((blob) => blob.pathname === pathname);
    if (match) return match;
    cursor = page.cursor;
  } while (cursor);
  return null;
}

export async function putStorageObject(key, body, contentType) {
  const pathname = normalizeKey(key);
  const payload = cloneBuffer(body);

  if (!hasGachaStorageConfig()) {
    assertStorageConfig();
    memoryObjects.set(pathname, {
      body: payload,
      contentType: contentType || "application/octet-stream",
      uploadedAt: new Date()
    });
    return { key: pathname, pathname, url: `memory://${pathname}`, storage: "memory" };
  }

  const blob = await put(pathname, payload, {
    access: "public",
    addRandomSuffix: false,
    contentType: contentType || "application/octet-stream"
  });
  return {
    key: pathname,
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    storage: "blob"
  };
}

export async function getStorageObject(key) {
  const pathname = normalizeKey(key);

  if (!hasGachaStorageConfig()) {
    assertStorageConfig();
    const item = memoryObjects.get(pathname);
    return item ? cloneBuffer(item.body) : null;
  }

  const blob = await findBlob(pathname);
  if (!blob?.url) return null;
  const response = await fetch(blob.url, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Blob get failed: ${response.status} ${text.slice(0, 200)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function putStorageJson(key, data) {
  return putStorageObject(key, JSON.stringify(data, null, 2), "application/json; charset=utf-8");
}

export async function getStorageJson(key) {
  const object = await getStorageObject(key);
  if (!object) return null;
  return JSON.parse(object.toString("utf8"));
}

export async function listStorageBlobs(prefix, maxKeys = 1000) {
  const normalizedPrefix = normalizeKey(prefix);
  const blobs = [];

  if (!hasGachaStorageConfig()) {
    assertStorageConfig();
    for (const [pathname, item] of memoryObjects.entries()) {
      if (!pathname.startsWith(normalizedPrefix)) continue;
      blobs.push({
        pathname,
        url: `memory://${pathname}`,
        size: item.body.length,
        uploadedAt: item.uploadedAt
      });
      if (blobs.length >= maxKeys) break;
    }
    return blobs;
  }

  let cursor;
  do {
    const page = await list({
      prefix: normalizedPrefix,
      cursor,
      limit: Math.min(1000, maxKeys - blobs.length)
    });
    blobs.push(...(page.blobs || []));
    cursor = page.cursor;
  } while (cursor && blobs.length < maxKeys);

  return blobs.slice(0, maxKeys);
}

export async function listStorageKeys(prefix, maxKeys = 1000) {
  const blobs = await listStorageBlobs(prefix, maxKeys);
  return blobs.map((blob) => blob.pathname);
}

export async function deleteStorageUrls(urls) {
  if (!hasGachaStorageConfig()) {
    assertStorageConfig();
    return;
  }
  const blobUrls = (Array.isArray(urls) ? urls : [urls])
    .map((url) => String(url || ""))
    .filter((url) => url.startsWith("http"));
  if (!blobUrls.length) return;
  await del(blobUrls);
}
