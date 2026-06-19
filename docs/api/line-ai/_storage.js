import { list, put } from "@vercel/blob";
import { truncateText } from "./_text.js";

const PREFIX = "line-ai";
const USER_PREFIX = `${PREFIX}/users/`;
const CONVERSATION_PREFIX = `${PREFIX}/conversations/`;
const LINK_SESSION_PREFIX = `${PREFIX}/link-sessions/`;
const ALLOWED_DIAGNOSIS_SOURCES = new Set(["16school", "16stan", "16love", "16renai"]);
const MAX_DIAGNOSIS_HISTORY = 5;

const memoryStore = globalThis.__mobbyLineAiMemoryStore || new Map();
globalThis.__mobbyLineAiMemoryStore = memoryStore;

export function hasBlobConfig() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function clone(data) {
  return data == null ? null : JSON.parse(JSON.stringify(data));
}

async function findBlob(pathname) {
  const page = await list({ prefix: pathname, limit: 10 });
  if (!Array.isArray(page.blobs)) return null;
  return page.blobs.find((blob) => blob.pathname === pathname) || null;
}

export async function readJson(pathname) {
  if (!hasBlobConfig()) {
    return clone(memoryStore.get(pathname));
  }

  try {
    const blob = await findBlob(pathname);
    if (!blob?.url) return null;
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("[LINE AI STORAGE] read failed:", { pathname, message: error?.message });
    return clone(memoryStore.get(pathname));
  }
}

export async function writeJson(pathname, data) {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  memoryStore.set(pathname, clone(payload));

  if (!hasBlobConfig()) {
    return { ok: true, storage: "memory" };
  }

  await put(pathname, JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8"
  });
  return { ok: true, storage: "blob" };
}

export function userPath(userKey) {
  return `${USER_PREFIX}${userKey}.json`;
}

export function conversationPath(userKey) {
  return `${CONVERSATION_PREFIX}${userKey}.json`;
}

export function linkSessionPath(sessionId) {
  return `${LINK_SESSION_PREFIX}${sessionId}.json`;
}

function cleanString(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanPath(value) {
  const path = cleanString(value, 160);
  if (!path || !path.startsWith("/")) return "";
  return path.replace(/[?#].*$/, "");
}

function cleanDetailSections(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return null;
      const title = cleanString(section.title, 80);
      const body = cleanString(section.body, 500);
      if (!title || !body) return null;
      return { title, body };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export function isSupportedDiagnosisSource(source) {
  return ALLOWED_DIAGNOSIS_SOURCES.has(String(source || "").trim());
}

export function sanitizeDiagnosisPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const source = cleanString(input.source, 40);
  const resultName = cleanString(input.resultName, 120);
  if (!isSupportedDiagnosisSource(source) || !resultName) return null;

  const traits = Array.isArray(input.traits)
    ? input.traits.map((trait) => cleanString(trait, 120)).filter(Boolean).slice(0, 8)
    : [];
  const detailSections = cleanDetailSections(input.detailSections);

  return {
    source,
    sourceLabel: cleanString(input.sourceLabel, 120),
    resultId: cleanString(input.resultId, 80),
    resultName,
    resultSummary: cleanString(input.resultSummary, 500),
    traits,
    detailSections,
    pagePath: cleanPath(input.pagePath)
  };
}

export async function loadUser(userKey) {
  return readJson(userPath(userKey));
}

export async function saveUser(userKey, data) {
  return writeJson(userPath(userKey), data);
}

export async function loadLinkSession(sessionId) {
  return readJson(linkSessionPath(sessionId));
}

export async function saveLinkSession(sessionId, data) {
  return writeJson(linkSessionPath(sessionId), data);
}

export async function loadConversation(userKey) {
  return readJson(conversationPath(userKey));
}

export async function saveConversation(userKey, data) {
  return writeJson(conversationPath(userKey), data);
}

export function appendConversationMessage(conversation, role, text) {
  const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
  return {
    ...conversation,
    messages: [
      ...messages,
      { role, text: truncateText(text, 500), at: new Date().toISOString() }
    ].slice(-12)
  };
}

export function mergePersonalDiagnosisResult(user, diagnosis, options = {}) {
  const linkedAt = options.linkedAt || new Date().toISOString();
  const sanitized = sanitizeDiagnosisPayload(diagnosis);
  if (!sanitized) return user || null;

  const base = user && typeof user === "object"
    ? { ...user }
    : {
      version: 1,
      userKey: options.userKey || "",
      source: "line",
      sourceLabel: "LINE直接",
      registeredAt: linkedAt,
      lastMessageAt: "",
      messageCountDate: "",
      messageCountToday: 0
    };

  if (!base.userKey && options.userKey) {
    base.userKey = options.userKey;
  }
  if (!base.registeredAt) {
    base.registeredAt = linkedAt;
  }

  const historyItem = {
    source: sanitized.source,
    sourceLabel: sanitized.sourceLabel,
    resultId: sanitized.resultId,
    resultName: sanitized.resultName,
    resultSummary: sanitized.resultSummary,
    traits: sanitized.traits,
    detailSections: sanitized.detailSections,
    linkedAt
  };
  const existingHistory = Array.isArray(base.diagnosisHistory) ? base.diagnosisHistory : [];
  const diagnosisHistory = [
    historyItem,
    ...existingHistory.filter((item) => {
      return !(
        item?.source === historyItem.source &&
        item?.resultId === historyItem.resultId &&
        item?.resultName === historyItem.resultName
      );
    })
  ].slice(0, MAX_DIAGNOSIS_HISTORY);

  return {
    ...base,
    source: sanitized.source,
    sourceLabel: sanitized.sourceLabel,
    resultId: sanitized.resultId,
    resultName: sanitized.resultName,
    resultSummary: sanitized.resultSummary,
    traits: sanitized.traits,
    detailSections: sanitized.detailSections,
    personalResultLinked: true,
    linkedAt,
    diagnosisHistory
  };
}
