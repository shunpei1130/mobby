import { createHash, createHmac } from "crypto";
import { Readable } from "stream";
import health from "../api/line-ai/health.js";
import issueToken from "../api/line-ai/issue-link-token.js";
import webhook from "../api/line-ai/webhook.js";
import { generateGeminiReply, generateReply } from "../api/line-ai/_ai.js";
import { verifyLineSignature } from "../api/line-ai/_line.js";
import { loadConversation, loadToken, loadUser, saveConversation, saveToken, saveUser } from "../api/line-ai/_storage.js";
import { detectSafetyRisk } from "../api/line-ai/_safety.js";

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sign(raw) {
  return createHmac("sha256", process.env.LINE_CHANNEL_SECRET).update(Buffer.from(raw)).digest("base64");
}

function createWebhookReq(payload, signature) {
  const raw = JSON.stringify(payload);
  const req = Readable.from([raw]);
  req.method = "POST";
  req.headers = { "x-line-signature": signature || sign(raw) };
  return req;
}

function makeUserKey(lineUserId) {
  return createHash("sha256").update(`${lineUserId}:${process.env.MOBBY_LINE_AI_SECRET}`).digest("hex");
}

async function callHealth() {
  const res = createRes();
  await health({ method: "GET", headers: {} }, res);
  assert(res.statusCode === 200, "health should return 200");
  assert(res.body?.ok === true, "health should return ok");
  assert(res.body?.provider === "mock", "health should expose provider");
  assert(res.body?.configured?.lineAddUrl === true, "health should expose line env status");
}

async function callIssueToken() {
  const res = createRes();
  await issueToken({
    method: "POST",
    headers: {},
    body: {
      diagnosis: {
        source: "16school",
        sourceLabel: "学校モビー診断",
        resultId: "TEST",
        resultName: "テストモビー",
        resultSummary: "テスト用の診断結果",
        traits: ["明るい"],
        pagePath: "/16school/",
        createdAt: new Date().toISOString()
      }
    }
  }, res);
  assert(res.statusCode === 200, "valid token request should return 200");
  assert(/^MB-[A-Z0-9]{6}$/.test(res.body?.token || ""), "token should match MB-XXXXXX");
  assert(res.body?.firstMessageText === `モビー登録 ${res.body.token}`, "firstMessageText should include token");
  return res.body.token;
}

async function callInvalidIssueToken() {
  const res = createRes();
  await issueToken({
    method: "POST",
    headers: {},
    body: { diagnosis: { source: "invalid", resultName: "x", pagePath: "/invalid/" } }
  }, res);
  assert(res.statusCode === 400, "invalid source should return 400");
}

async function callWebhookFlow(token) {
  const raw = JSON.stringify({ events: [] });
  assert(verifyLineSignature(Buffer.from(raw), sign(raw), process.env.LINE_CHANNEL_SECRET), "signature helper should validate");

  const invalidSigRes = createRes();
  await webhook(createWebhookReq({ events: [] }, "bad"), invalidSigRes);
  assert(invalidSigRes.statusCode === 401, "invalid LINE signature should be rejected");

  const lineUserId = "U_VALIDATE_LINE_USER";
  const userKey = makeUserKey(lineUserId);
  const linkRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-link",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "1", text: `モビー登録 ${token}` }
    }]
  }), linkRes);
  assert(linkRes.statusCode === 200, "valid token webhook should return 200");

  const linkedUser = await loadUser(userKey);
  assert(linkedUser?.resultName === "テストモビー", "linked user should store diagnosis result");
  assert(JSON.stringify(linkedUser).includes(lineUserId) === false, "raw LINE userId should not be stored");

  const replyRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-normal",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "2", text: "今日は少し相談したい" }
    }]
  }), replyRes);
  let conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("テストモビー"), "mock reply should reference diagnosis result");

  const crisisText = "\u3082\u3046\u7121\u7406\u3001\u6d88\u3048\u305f\u3044";
  assert(detectSafetyRisk(crisisText).hasRisk, "safety detector should catch crisis text");
  const safetyRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-safety",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "3", text: crisisText }
    }]
  }), safetyRes);
  conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("\u3072\u3068\u308a\u3067\u62b1\u3048\u305a"), "safety reply should be fixed safe text");

  await saveUser(userKey, {
    ...linkedUser,
    messageCountDate: new Date().toISOString().slice(0, 10),
    messageCountToday: 20
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [] });
  const rateRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-rate",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "4", text: "\u666e\u901a\u306e\u76f8\u8ac7\u3067\u3059" }
    }]
  }), rateRes);
  conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("\u4eca\u65e5\u306f\u3053\u3053\u307e\u3067"), "rate limit reply should be used");

  await saveToken("MB-OLD123", {
    version: 1,
    token: "MB-OLD123",
    status: "pending",
    diagnosis: linkedUser,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() - 1000).toISOString()
  });
  const expiredRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-expired",
      source: { type: "user", userId: "U_EXPIRED_USER" },
      message: { type: "text", id: "5", text: "MB-OLD123" }
    }]
  }), expiredRes);
  const expiredToken = await loadToken("MB-OLD123");
  assert(expiredRes.statusCode === 200, "expired token webhook should return 200");
  assert(expiredToken.status === "expired", "expired token should be marked expired");

  const invalidTokenRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-invalid",
      source: { type: "user", userId: "U_INVALID_TOKEN_USER" },
      message: { type: "text", id: "6", text: "MB-NOPE11" }
    }]
  }), invalidTokenRes);
  assert(invalidTokenRes.statusCode === 200, "invalid token webhook should return 200");
}

async function callWebhookMarkAsReadFlow() {
  const originalFetch = globalThis.fetch;
  const originalAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const originalConsoleError = console.error;
  const lineUserId = "U_MARK_READ_USER";
  const userKey = makeUserKey(lineUserId);

  await saveUser(userKey, {
    version: 1,
    userKey,
    source: "16school",
    sourceLabel: "学校モビー診断",
    resultId: "MARK_READ_TEST",
    resultName: "既読テストモビー",
    resultSummary: "既読化テスト用の診断結果",
    traits: ["確認"],
    registeredAt: new Date().toISOString(),
    lastMessageAt: "",
    messageCountDate: "",
    messageCountToday: 0
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [], summary: "", dailyCountDate: "", dailyCount: 0 });

  try {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "line-access-token-test";

    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({
        url: String(url),
        body: options?.body,
        authorization: options?.headers?.Authorization,
        contentType: options?.headers?.["Content-Type"]
      });
      return {
        ok: true,
        status: 200,
        async text() {
          return "";
        }
      };
    };

    const markRes = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-mark-read",
        source: { type: "user", userId: lineUserId },
        message: {
          type: "text",
          id: "7",
          text: "既読化の順序を確認したい",
          markAsReadToken: "mark-token-1"
        }
      }]
    }), markRes);
    assert(markRes.statusCode === 200, "mark-as-read webhook should return 200");
    assert(calls[0]?.url === "https://api.line.me/v2/bot/chat/markAsRead", "mark-as-read should run before reply");
    assert(calls[1]?.url === "https://api.line.me/v2/bot/message/reply", "reply should run after mark-as-read");
    assert(calls[0].authorization === "Bearer line-access-token-test", "mark-as-read should use LINE access token");
    assert(calls[0].contentType === "application/json", "mark-as-read should send JSON");
    assert(JSON.parse(calls[0].body).markAsReadToken === "mark-token-1", "mark-as-read body should include token");

    const noTokenCalls = [];
    globalThis.fetch = async (url, options) => {
      noTokenCalls.push({ url: String(url), body: options?.body });
      return {
        ok: true,
        status: 200,
        async text() {
          return "";
        }
      };
    };

    const noTokenRes = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-no-mark-token",
        source: { type: "user", userId: lineUserId },
        message: { type: "text", id: "8", text: "トークンなしの確認" }
      }]
    }), noTokenRes);
    assert(noTokenRes.statusCode === 200, "message without mark token should still return 200");
    assert(noTokenCalls.every((call) => call.url !== "https://api.line.me/v2/bot/chat/markAsRead"), "missing mark token should not call mark-as-read");
    assert(noTokenCalls.some((call) => call.url === "https://api.line.me/v2/bot/message/reply"), "message without mark token should still reply");

    const failedCalls = [];
    const errors = [];
    console.error = (...args) => {
      errors.push(args);
    };
    globalThis.fetch = async (url, options) => {
      failedCalls.push({ url: String(url), body: options?.body });
      if (String(url) === "https://api.line.me/v2/bot/chat/markAsRead") {
        return {
          ok: false,
          status: 500,
          async text() {
            return "mark failed";
          }
        };
      }
      return {
        ok: true,
        status: 200,
        async text() {
          return "";
        }
      };
    };

    const failedMarkRes = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-mark-read-failed",
        source: { type: "user", userId: lineUserId },
        message: {
          type: "text",
          id: "9",
          text: "既読化失敗時の確認",
          markAsReadToken: "mark-token-500"
        }
      }]
    }), failedMarkRes);
    assert(failedMarkRes.statusCode === 200, "mark-as-read failure should not fail webhook");
    assert(failedCalls[0]?.url === "https://api.line.me/v2/bot/chat/markAsRead", "failed mark-as-read should run before reply");
    assert(failedCalls.some((call) => call.url === "https://api.line.me/v2/bot/message/reply"), "reply should continue after mark-as-read failure");
    assert(errors.some((args) => String(args[0]).includes("Mark as read failed")), "mark-as-read failure should be logged");
  } finally {
    globalThis.fetch = originalFetch;
    process.env.LINE_CHANNEL_ACCESS_TOKEN = originalAccessToken;
    console.error = originalConsoleError;
  }
}

async function callGeminiProviderFlow() {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.AI_PROVIDER;
  const originalModel = process.env.AI_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  const user = {
    source: "16renai",
    sourceLabel: "恋愛モビー診断",
    resultName: "テスト恋愛モビー",
    resultSummary: "言葉の温度に敏感",
    traits: ["慎重", "やさしい"]
  };

  try {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    globalThis.fetch = async (url, options) => {
      assert(String(url).includes("gemini-2.5-flash-lite:generateContent"), "Gemini URL should include selected model");
      assert(options?.headers?.["x-goog-api-key"] === "test-gemini-key", "Gemini request should include API key header");
      const payload = JSON.parse(options.body);
      assert(payload.system_instruction.parts[0].text.includes("テスト恋愛モビー"), "Gemini request should include diagnosis prompt");
      assert(payload.contents.at(-1).parts[0].text === "LINE文面を考えたい", "Gemini request should include user message");
      return {
        ok: true,
        async json() {
          return {
            candidates: [{
              content: {
                parts: [{ text: "その文面、やさしさはあるよ。少しだけ軽くして、相手が返しやすい一言にしよう。" }]
              }
            }]
          };
        }
      };
    };

    const geminiReply = await generateGeminiReply({
      user,
      message: "LINE文面を考えたい",
      history: [{ role: "user", text: "好きな人に送りたい" }]
    });
    assert(geminiReply.includes("返しやすい"), "Gemini reply should return model text");

    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      async text() {
        return "rate limited";
      }
    });

    const fallbackReply = await generateReply({
      user,
      message: "LINE文面を考えたい",
      history: []
    });
    assert(fallbackReply.includes("テスト恋愛モビー"), "Gemini failure should fall back to mock reply");
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_PROVIDER = originalProvider;
    process.env.AI_MODEL = originalModel;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
}

process.env.LINE_ADD_URL = process.env.LINE_ADD_URL || "https://lin.ee/test";
process.env.LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "line-secret-test";
process.env.MOBBY_LINE_AI_SECRET = process.env.MOBBY_LINE_AI_SECRET || "mobby-secret-test";
process.env.AI_PROVIDER = "mock";
delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
delete process.env.BLOB_READ_WRITE_TOKEN;

await callHealth();
const token = await callIssueToken();
await callInvalidIssueToken();
await callWebhookFlow(token);
await callWebhookMarkAsReadFlow();
await callGeminiProviderFlow();

console.log("LINE AI Mobby MVP-2 validation passed");
