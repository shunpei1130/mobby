import crypto from "crypto";

const SERVICE = "s3";
const REGION = "auto";

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getR2Config() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return {
    accountId,
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: process.env.R2_BUCKET_NAME || "mobby-gacha-results",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    publicBaseUrl: String(process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/u, "")
  };
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePath(pathname) {
  return pathname.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function encodeQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

function signRequest({ method, key = "", query = {}, body = Buffer.alloc(0), contentType = "" }) {
  const config = getR2Config();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/gu, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${config.bucket}${key ? `/${encodePath(key)}` : ""}`;
  const canonicalQuery = encodeQuery(query);
  const payloadHash = sha256(body);
  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((header) => `${header}:${headers[header]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join("\n");
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, REGION);
  const serviceKey = hmac(regionKey, SERVICE);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");

  return {
    url: `${config.endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    },
    publicBaseUrl: config.publicBaseUrl
  };
}

export function publicR2Url(key) {
  const { publicBaseUrl } = getR2Config();
  if (!publicBaseUrl) throw new Error("R2_PUBLIC_BASE_URL is not configured");
  return `${publicBaseUrl}/${encodePath(key)}`;
}

export async function putR2Object(key, body, contentType) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ""));
  const signed = signRequest({ method: "PUT", key, body: payload, contentType });
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body: payload
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 put failed: ${response.status} ${text.slice(0, 200)}`);
  }
  return { key, url: publicR2Url(key) };
}

export async function getR2Object(key) {
  const signed = signRequest({ method: "GET", key });
  const response = await fetch(signed.url, { method: "GET", headers: signed.headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 get failed: ${response.status} ${text.slice(0, 200)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function putR2Json(key, data) {
  return putR2Object(key, JSON.stringify(data, null, 2), "application/json; charset=utf-8");
}

export async function getR2Json(key) {
  const object = await getR2Object(key);
  if (!object) return null;
  return JSON.parse(object.toString("utf8"));
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, "\"")
    .replace(/&apos;/gu, "'")
    .replace(/&amp;/gu, "&");
}

export async function listR2Keys(prefix, maxKeys = 1000) {
  const signed = signRequest({
    method: "GET",
    query: {
      "list-type": "2",
      prefix,
      "max-keys": String(maxKeys)
    }
  });
  const response = await fetch(signed.url, { method: "GET", headers: signed.headers });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 list failed: ${response.status} ${text.slice(0, 200)}`);
  }
  const xml = await response.text();
  return Array.from(xml.matchAll(/<Key>([\s\S]*?)<\/Key>/gu)).map((match) => decodeXml(match[1]));
}
