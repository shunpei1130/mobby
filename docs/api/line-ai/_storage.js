import { list, put } from "@vercel/blob";

const PREFIX = "line-ai";
const USER_PREFIX = `${PREFIX}/users/`;
const CONVERSATION_PREFIX = `${PREFIX}/conversations/`;

const memoryStore = globalThis.__mobbyLineAiMemoryStore || new Map();
globalThis.__mobbyLineAiMemoryStore = memoryStore;

function hasBlobConfig() {
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

export async function loadUser(userKey) {
  return readJson(userPath(userKey));
}

export async function saveUser(userKey, data) {
  return writeJson(userPath(userKey), data);
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
      { role, text: String(text || "").slice(0, 500), at: new Date().toISOString() }
    ].slice(-12)
  };
}
