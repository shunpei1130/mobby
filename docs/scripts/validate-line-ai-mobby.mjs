import { createHash, createHmac } from "crypto";
import { Readable } from "stream";
import health from "../api/line-ai/health.js";
import issueToken from "../api/line-ai/issue-link-token.js";
import liffLink from "../api/line-ai/liff-link.js";
import linkSessions from "../api/line-ai/link-sessions.js";
import webhook from "../api/line-ai/webhook.js";
import { generateGeminiReply, generateReply } from "../api/line-ai/_ai.js";
import { toLineTextMessage, verifyLineSignature } from "../api/line-ai/_line.js";
import { buildSystemPrompt } from "../api/line-ai/_prompts.js";
import { canReply, canReplyGlobally, todayKey } from "../api/line-ai/_rate-limit.js";
import {
  loadConversation,
  loadLinkSession,
  loadUser,
  saveConversation,
  saveLinkSession,
  saveUser
} from "../api/line-ai/_storage.js";
import { detectSafetyRisk } from "../api/line-ai/_safety.js";
import { cleanUnicodeText, normalizeLineMessageText, stripEmojiForFallback, truncateText } from "../api/line-ai/_text.js";

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

const VALID_DIAGNOSIS = {
  source: "16love",
  sourceLabel: "メンヘラモビー診断",
  resultId: "あつすひ",
  resultName: "返信こないと死モビー",
  resultSummary: "好きな人の返信が命綱のように感じやすいタイプ。",
  traits: ["恋愛メンヘラ度: Lv.6", "恋の依存度: 彼氏ガチ勢"],
  pagePath: "/16love/",
  rawLineUserId: "U_SHOULD_NOT_BE_SAVED",
  email: "should-not-save@example.com",
  fullAnswers: ["保存しない回答全文"]
};

async function callHealth() {
  const res = createRes();
  await health({ method: "GET", headers: {} }, res);
  assert(res.statusCode === 200, "health should return 200");
  assert(res.body?.ok === true, "health should return ok");
  assert(res.body?.provider === "mock", "health should expose provider");
  assert(res.body?.features?.diagnosisKnowledge === true, "health should expose diagnosis knowledge feature");
  assert(res.body?.features?.mobbyKnowledge === true, "health should expose Mobby knowledge feature");
  assert(res.body?.features?.aiGeneratedKnowledgeReplies === true, "health should expose AI-generated knowledge reply feature");
  assert(res.body?.features?.personalResultReference === true, "health should expose personal result reference feature");
  assert(res.body?.features?.personalResultLinking === true, "health should expose enabled personal result linking");
  assert(res.body?.features?.compatibilityReply === true, "health should expose compatibility reply feature");
  assert(res.body?.features?.liffLinking === true, "health should expose enabled LIFF linking");
  assert(res.body?.configured?.lineAddUrl === true, "health should expose line env status");
  assert(res.body?.configured?.liffId === true, "health should expose LIFF ID status");
  assert(res.body?.configured?.lineLoginChannelId === true, "health should expose LINE Login channel ID status");
  assert(res.body?.configured?.lineLoginChannelSecret === true, "health should expose LINE Login channel secret status");
  assert(res.body?.configured?.personalResultLinkingFlag === true, "health should expose personal result linking flag");
}

async function callLineAddInfo() {
  const res = createRes();
  await issueToken({ method: "GET", headers: {} }, res);
  assert(res.statusCode === 200, "LINE add info should return 200");
  assert(res.body?.lineAddUrl === "https://lin.ee/test", "LINE add info should return configured add URL");
  assert(!res.body?.token, "LINE add info should not issue an extra code token");
  assert(res.body?.firstMessageText === "モビーだよ！なんでも話してね！", "LINE add info should include greeting");
}

async function callLineAddInfoIgnoresDiagnosis() {
  const res = createRes();
  await issueToken({
    method: "POST",
    headers: {},
    body: { diagnosis: { source: "invalid", resultName: "x", pagePath: "/invalid/" } }
  }, res);
  assert(res.statusCode === 200, "LINE add info should not require diagnosis data");
  assert(res.body?.lineAddUrl === "https://lin.ee/test", "diagnosis payload should be ignored for LINE add info");
  assert(!res.body?.token, "diagnosis payload should not issue an extra code token");
}

async function createLinkSessionForTest(diagnosis = VALID_DIAGNOSIS) {
  const res = createRes();
  await linkSessions({ method: "POST", headers: {}, body: diagnosis }, res);
  assert(res.statusCode === 200, "link session should return 200");
  assert(res.body?.ok === true, "link session should return ok");
  assert(/^ls_[A-Za-z0-9_-]{24,}$/.test(res.body?.sessionId), "link session should return a random session ID");
  assert(res.body?.liffUrl?.includes("https://liff.line.me/liff-id-test/?s="), "link session should return LIFF URL with session as additional information");
  assert(res.body?.lineAddUrl === "https://lin.ee/test", "link session should include LINE add URL");
  return res.body.sessionId;
}

async function callLinkSessionFlow() {
  const sessionId = await createLinkSessionForTest();
  const session = await loadLinkSession(sessionId);
  assert(session?.diagnosis?.source === "16love", "link session should save diagnosis source");
  assert(session?.diagnosis?.resultName === "返信こないと死モビー", "link session should save result name");
  assert(Array.isArray(session?.diagnosis?.traits), "link session should save sanitized traits");
  assert(session?.expiresAt && Date.parse(session.expiresAt) > Date.now(), "link session should save a future expiry");
  assert(JSON.stringify(session).includes("U_SHOULD_NOT_BE_SAVED") === false, "link session should not save raw LINE user ID");
  assert(JSON.stringify(session).includes("should-not-save@example.com") === false, "link session should not save email");
  assert(JSON.stringify(session).includes("保存しない回答全文") === false, "link session should not save full answers");

  const unsupportedRes = createRes();
  await linkSessions({
    method: "POST",
    headers: {},
    body: { ...VALID_DIAGNOSIS, source: "hinata-aoi", pagePath: "/hinata-aoi/" }
  }, unsupportedRes);
  assert(unsupportedRes.statusCode === 400, "unsupported diagnosis source should be rejected");

  const optionsRes = createRes();
  await linkSessions({ method: "OPTIONS", headers: {} }, optionsRes);
  assert(optionsRes.statusCode === 200, "link session should support OPTIONS");

  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    process.env.VERCEL_ENV = "production";
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const missingBlobRes = createRes();
    await linkSessions({ method: "POST", headers: {}, body: VALID_DIAGNOSIS }, missingBlobRes);
    assert(missingBlobRes.statusCode === 503, "production link session should require Blob config");
  } finally {
    process.env.VERCEL_ENV = originalVercelEnv;
    if (originalBlobToken) process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    else delete process.env.BLOB_READ_WRITE_TOKEN;
  }
}

async function callLiffLinkFlow() {
  const originalFetch = globalThis.fetch;
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;

  try {
    const configRes = createRes();
    await liffLink({ method: "GET", headers: {} }, configRes);
    assert(configRes.statusCode === 200, "LIFF config should return 200");
    assert(configRes.body?.liffId === "liff-id-test", "LIFF config should expose public LIFF ID");

    const validSessionId = await createLinkSessionForTest();
    const verifyCalls = [];
    globalThis.fetch = async (url, options) => {
      verifyCalls.push({ url: String(url), body: String(options?.body || ""), contentType: options?.headers?.["Content-Type"] });
      return {
        ok: true,
        status: 200,
        async json() {
          return { aud: channelId, sub: "U_LIFF_VALIDATE_USER" };
        }
      };
    };

    const linkRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: validSessionId, idToken: "valid-id-token" }
    }, linkRes);
    assert(linkRes.statusCode === 200, "valid LIFF link should return 200");
    assert(linkRes.body?.linked === true, "valid LIFF link should return linked");
    assert(linkRes.body?.resultName === "返信こないと死モビー", "valid LIFF link should return result name");
    assert(!linkRes.body?.userKey, "LIFF link response should not expose userKey");
    assert(verifyCalls[0]?.url === "https://api.line.me/oauth2/v2.1/verify", "LIFF link should verify ID token with LINE");
    assert(verifyCalls[0]?.contentType === "application/x-www-form-urlencoded", "LIFF verify should use form encoding");
    assert(verifyCalls[0]?.body.includes("client_id=line-login-channel-id-test"), "LIFF verify should include LINE Login channel ID");

    const user = await loadUser(makeUserKey("U_LIFF_VALIDATE_USER"));
    assert(user?.personalResultLinked === true, "LIFF link should save personal result linked flag");
    assert(user?.resultName === "返信こないと死モビー", "LIFF link should save result name");
    assert(user?.diagnosisHistory?.length === 1, "LIFF link should save diagnosis history");
    assert(JSON.stringify(user).includes("U_LIFF_VALIDATE_USER") === false, "user record should not save raw LINE user ID");
    assert(JSON.stringify(user).includes("should-not-save@example.com") === false, "user record should not save email");

    const consumedSession = await loadLinkSession(validSessionId);
    assert(consumedSession?.consumedAt, "LIFF link should mark session consumed");

    const consumedRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: validSessionId, idToken: "valid-id-token" }
    }, consumedRes);
    assert(consumedRes.statusCode === 409, "consumed LIFF session should be rejected");

    const expiredSessionId = "ls_expiredSessionForValidate0001";
    await saveLinkSession(expiredSessionId, {
      version: 1,
      sessionId: expiredSessionId,
      diagnosis: VALID_DIAGNOSIS,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 30 * 1000).toISOString(),
      consumedAt: null
    });
    const expiredRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: expiredSessionId, idToken: "valid-id-token" }
    }, expiredRes);
    assert(expiredRes.statusCode === 410, "expired LIFF session should be rejected");

    const invalidTokenSessionId = await createLinkSessionForTest();
    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      async text() {
        return "bad token";
      }
    });
    const invalidTokenRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: invalidTokenSessionId, idToken: "bad-id-token" }
    }, invalidTokenRes);
    assert(invalidTokenRes.statusCode === 400, "invalid LINE ID token should be rejected");

    const badAudSessionId = await createLinkSessionForTest();
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return { aud: "wrong-channel", sub: "U_BAD_AUD" };
      }
    });
    const badAudRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: badAudSessionId, idToken: "bad-aud-token" }
    }, badAudRes);
    assert(badAudRes.statusCode === 401, "LINE ID token audience mismatch should be rejected");

    const missingSubSessionId = await createLinkSessionForTest();
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return { aud: channelId };
      }
    });
    const missingSubRes = createRes();
    await liffLink({
      method: "POST",
      headers: {},
      body: { sessionId: missingSubSessionId, idToken: "missing-sub-token" }
    }, missingSubRes);
    assert(missingSubRes.statusCode === 401, "LINE ID token without subject should be rejected");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function hasUnpairedSurrogate(value) {
  return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(String(value || ""));
}

async function callLiffPageStaticCheck() {
  const page = await import("node:fs/promises")
    .then((fs) => fs.readFile(new URL("../line-ai/link/index.html", import.meta.url), "utf8"));
  assert(page.includes('params.get("liff.state")'), "LIFF link page should read session ID from liff.state");
  assert(page.includes('params.get("s")'), "LIFF link page should keep direct session ID support");
  assert(page.includes("data-line-login"), "LIFF link page should provide a user-tap LINE login button");
  assert(page.includes("shouldUseManualLineLogin"), "LIFF link page should gate iOS external-browser login behind a user tap");
  assert(page.includes("isTikTokBrowser"), "LIFF link page should detect TikTok in-app browser");
  assert(page.includes("buildRestrictedBrowserOpenUrl"), "LIFF link page should build a restricted-browser handoff URL");
  assert(page.includes("https://liff.line.me/${encodeURIComponent(liffId)}/?s="), "LIFF link page should build official LIFF URLs with session as additional information");
  assert(page.includes("if (isTikTokBrowser()) return liffUrl;"), "LIFF link page should keep the official LIFF URL as the primary TikTok handoff URL");
  assert(page.includes("TikTokでLINEが開かない場合"), "LIFF link page should guide TikTok users to open the page in an external browser when needed");
  assert(page.includes("line://app/"), "LIFF link page should keep a LINE app scheme fallback for non-TikTok app handoff");
  assert(page.includes("(isTikTokBrowser() || isIosDevice())"), "LIFF link page should use app handoff for Safari as well as TikTok");
  assert(!page.includes("if (!sessionId || !window.liff)"), "LIFF link app-handoff button should work even when the LIFF SDK is unavailable");
  assert(page.includes("buildRedirectUri(sessionId)"), "LIFF link page should preserve session ID in login redirects");
  assert(!page.includes("window.liff.login({ redirectUri: window.location.href })"), "LIFF link page should not auto-login with the raw current URL");
}

async function callSharedCtaStaticCheck() {
  const cta = await import("node:fs/promises")
    .then((fs) => fs.readFile(new URL("../shared/line-ai-mobby-cta.js", import.meta.url), "utf8"));
  assert(cta.includes("primeOpenTarget(element)"), "diagnosis CTA should prepare the LINE URL before the user's tap");
  assert(cta.includes("data-line-ai-mobby-ready"), "diagnosis CTA should mark direct-open links as ready");
  assert(cta.includes("shouldWaitForTapToOpen"), "diagnosis CTA should avoid post-async auto-open on Safari");
  assert(cta.includes("isTikTokInAppBrowser"), "diagnosis CTA should detect TikTok in-app browser");
  assert(cta.includes("shouldUseLineAppHandoff"), "diagnosis CTA should use explicit LINE app handoff for restricted browsers");
  assert(cta.includes("enhanced.openUrl = liffUrl"), "diagnosis CTA should keep the official LIFF URL as the primary TikTok/Safari URL");
  assert(cta.includes('enhanced.fallbackOpenUrl = enhanced.lineAddUrl || ""'), "diagnosis CTA should avoid custom-scheme fallback URLs on TikTok");
  assert(cta.includes("TikTokでLINEが開かない場合"), "diagnosis CTA should guide TikTok users to open the page in an external browser when needed");
  assert(cta.includes("renderTapToOpenResult"), "diagnosis CTA should render a tap-to-open handoff panel for Safari and TikTok");
  assert(cta.includes("cached?.data"), "diagnosis CTA should show the handoff panel even when the LIFF URL was prepared before the first tap");
  assert(cta.includes("buildLineAppUrl"), "diagnosis CTA should build a LINE app scheme fallback for LIFF URLs");
  assert(cta.includes("fallbackOpenUrl"), "diagnosis CTA should keep explicit fallback links");
}

async function callKnowledgeReplyFlow() {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.AI_PROVIDER;
  const originalModel = process.env.AI_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  const linkedUser = {
    source: "16renai",
    sourceLabel: "恋愛モビー診断",
    resultId: "SFTC",
    resultName: "夜風のロマンチスト",
    resultSummary: "自由な距離感の中で、二人だけのロマンを静かに育てるタイプ。",
    traits: ["自由もほしい型", "ときめき重視型"],
    personalResultLinked: true
  };

  const cases = [
    {
      message: "モビー診断って何種類ある？",
      user: { source: "line" },
      reply: "モビー診断は4種類あるよ。気分に合わせて選べる感じだね。",
      check(systemPrompt) {
        assert(systemPrompt.includes("Mobby共通ナレッジ"), "overview prompt should include Mobby knowledge");
        assert(systemPrompt.includes("通常公開のモビー診断は4種類"), "overview prompt should include diagnosis overview");
        assert(systemPrompt.includes("学校モビー診断"), "overview prompt should include school diagnosis");
        assert(systemPrompt.includes("恋愛モビー診断"), "overview prompt should include renai diagnosis");
      }
    },
    {
      message: "推し活のタイプ一覧教えて",
      user: { source: "line" },
      reply: "推し活モビー診断は16タイプあるよ。名前だけでもかなり個性が出てる。",
      check(systemPrompt) {
        assert(systemPrompt.includes("推し活モビー診断"), "type list prompt should include stan diagnosis");
        assert(systemPrompt.includes("現場至上主義"), "type list prompt should include stan type names");
        assert(systemPrompt.includes("情報整理"), "type list prompt should include all stan type names");
      }
    },
    {
      message: "返信こないと死モビーってどんなタイプ？",
      user: { source: "line" },
      reply: "返信こないと死モビーは、返信待ちで不安が大きくなりやすいタイプだよ。",
      check(systemPrompt) {
        assert(systemPrompt.includes("メンヘラモビー診断"), "type prompt should identify love diagnosis by type");
        assert(systemPrompt.includes("返信こないと死モビー"), "type prompt should include matched type name");
        assert(systemPrompt.includes("好きな人の返信が命綱"), "type prompt should include matched type summary");
      }
    },
    {
      message: "私の診断結果覚えてる？",
      user: { source: "line", personalResultLinked: false },
      reply: "まだ診断結果は連携されてないみたい。結果ページからLINE連携すると見られるよ。",
      check(systemPrompt) {
        assert(systemPrompt.includes("診断結果が未連携"), "missing result prompt should include unlinked result guidance");
        assert(systemPrompt.includes("診断結果ページからLINE連携"), "missing result prompt should guide result linking");
      }
    },
    {
      message: "私の診断結果覚えてる？",
      user: linkedUser,
      reply: "覚えてるよ。あなたは夜風のロマンチストで、自由な距離感を大事にするタイプだね。",
      check(systemPrompt) {
        assert(systemPrompt.includes("ユーザー個別の診断結果背景"), "linked result prompt should include personal diagnosis context");
        assert(systemPrompt.includes("夜風のロマンチスト"), "linked result prompt should include saved result name");
        assert(systemPrompt.includes("自由な距離感"), "linked result prompt should include saved result summary");
      }
    }
  ];

  try {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    let geminiCall = 0;
    globalThis.fetch = async (url, options) => {
      const testCase = cases[geminiCall];
      geminiCall += 1;
      assert(testCase, "knowledge questions should call Gemini exactly once per case");
      assert(String(url).includes("gemini-2.5-flash-lite:generateContent"), "knowledge reply should call Gemini");
      const payload = JSON.parse(options.body);
      const systemPrompt = payload.system_instruction.parts[0].text;
      assert(payload.contents.at(-1).parts[0].text === testCase.message, "Gemini request should include the knowledge question");
      testCase.check(systemPrompt);
      return {
        ok: true,
        async json() {
          return {
            candidates: [{
              content: { parts: [{ text: testCase.reply }] }
            }]
          };
        }
      };
    };

    for (const testCase of cases) {
      const reply = await generateReply({
        user: testCase.user,
        message: testCase.message,
        history: []
      });
      assert(reply === testCase.reply, "knowledge answer should be generated by Gemini, not deterministic code");
    }
    assert(geminiCall === cases.length, "all knowledge cases should reach Gemini");
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_PROVIDER = originalProvider;
    process.env.AI_MODEL = originalModel;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
}

async function callCompatibilityReplyFlow() {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.AI_PROVIDER;
  const originalModel = process.env.AI_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  const linkedUser = {
    source: "16love",
    sourceLabel: "メンヘラモビー診断",
    resultId: "あつすひ",
    resultName: "返信こないと死モビー",
    resultSummary: "好きな人の返信が命綱のように感じやすいタイプ。",
    personalResultLinked: true
  };

  const cases = [
    {
      user: linkedUser,
      message: "私と相性いいモビーは？",
      reply: "診断上の遊びで見ると、返信こないと死モビーには安心感が近いタイプが合いやすいかも。",
      check(systemPrompt) {
        assert(systemPrompt.includes("相性質問コンテキスト"), "linked compatibility prompt should include compatibility context");
        assert(systemPrompt.includes("返信こないと死モビー"), "linked compatibility prompt should include saved base type");
        assert(systemPrompt.includes("相性候補"), "linked compatibility prompt should include candidate list");
        assert(systemPrompt.includes("現実の関係を断定しない"), "linked compatibility prompt should include nondeterministic guardrail");
      }
    },
    {
      user: { source: "line", personalResultLinked: false },
      message: "返信こないと死モビーと相性いいタイプは？",
      reply: "返信こないと死モビー基準なら、近い不安をわかり合える相手が候補に入りやすいよ。",
      check(systemPrompt) {
        assert(systemPrompt.includes("相性質問コンテキスト"), "explicit compatibility prompt should include compatibility context");
        assert(systemPrompt.includes("返信こないと死モビー"), "explicit compatibility prompt should use explicit type names in message");
        assert(systemPrompt.includes("相性候補"), "explicit compatibility prompt should include candidate list");
      }
    },
    {
      user: { source: "line", personalResultLinked: false },
      message: "私と相性いいモビーは？",
      reply: "あなた基準の相性を見るなら、診断結果ページからLINE連携してくれると出せるよ。",
      check(systemPrompt) {
        assert(systemPrompt.includes("相性質問コンテキスト"), "unlinked compatibility prompt should include compatibility context");
        assert(systemPrompt.includes("未連携"), "unlinked compatibility prompt should explain missing linked result");
        assert(systemPrompt.includes("診断結果ページからLINE連携"), "unlinked compatibility prompt should guide result linking");
      }
    }
  ];

  try {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    let geminiCall = 0;
    globalThis.fetch = async (url, options) => {
      const testCase = cases[geminiCall];
      geminiCall += 1;
      assert(testCase, "compatibility questions should call Gemini exactly once per case");
      assert(String(url).includes("gemini-2.5-flash-lite:generateContent"), "compatibility reply should call Gemini");
      const payload = JSON.parse(options.body);
      const systemPrompt = payload.system_instruction.parts[0].text;
      assert(payload.contents.at(-1).parts[0].text === testCase.message, "Gemini request should include the compatibility question");
      testCase.check(systemPrompt);
      return {
        ok: true,
        async json() {
          return {
            candidates: [{
              content: { parts: [{ text: testCase.reply }] }
            }]
          };
        }
      };
    };

    for (const testCase of cases) {
      const reply = await generateReply({
        user: testCase.user,
        message: testCase.message,
        history: []
      });
      assert(reply === testCase.reply, "compatibility answer should be generated by Gemini, not deterministic code");
    }
    assert(geminiCall === cases.length, "all compatibility cases should reach Gemini");
  } finally {
    globalThis.fetch = originalFetch;
    process.env.AI_PROVIDER = originalProvider;
    process.env.AI_MODEL = originalModel;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
}

async function callDisplayNameCueFlow() {
  const promptWithoutCue = buildSystemPrompt({
    source: "line",
    lineDisplayName: "しゅん"
  }, "相談したい");
  assert(!promptWithoutCue.includes("相手のLINE表示名"), "display name should not be exposed to prompt without occasional cue");

  const promptWithCue = buildSystemPrompt({
    source: "line",
    lineDisplayName: "しゅん",
    lineDisplayNameUseAllowed: true
  }, "相談したい");
  assert(promptWithCue.includes("相手のLINE表示名: しゅん"), "display name cue should include the LINE display name");
  assert(promptWithCue.includes("名前は毎回呼ばない"), "display name cue should keep name use occasional");

  const originalFetch = globalThis.fetch;
  const originalAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const originalProvider = process.env.AI_PROVIDER;
  const originalModel = process.env.AI_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const lineUserId = "U_DISPLAY_NAME_CUE_USER";
  const userKey = makeUserKey(lineUserId);
  const today = todayKey();

  await saveUser(userKey, {
    version: 1,
    userKey,
    source: "line",
    sourceLabel: "LINE直接",
    registeredAt: new Date().toISOString(),
    lastMessageAt: "",
    messageCountDate: today,
    messageCountToday: 3
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [], summary: "", dailyCountDate: "", dailyCount: 0 });

  try {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "line-access-token-test";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    let geminiPrompt = "";
    globalThis.fetch = async (url, options) => {
      const urlText = String(url);
      if (urlText === `https://api.line.me/v2/bot/profile/${lineUserId}`) {
        return {
          ok: true,
          status: 200,
          async json() {
            return { displayName: "しゅん" };
          }
        };
      }
      if (urlText.includes("generativelanguage.googleapis.com")) {
        const payload = JSON.parse(options.body);
        geminiPrompt = payload.system_instruction.parts[0].text;
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              candidates: [{
                content: { parts: [{ text: "しゅんさん、その相談なら一緒にほどこう。" }] }
              }]
            };
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

    const res = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-display-name-cue",
        source: { type: "user", userId: lineUserId },
        message: { type: "text", id: "name-1", text: "相談したいことがある" }
      }]
    }), res);

    assert(res.statusCode === 200, "display name cue webhook should return 200");
    assert(geminiPrompt.includes("相手のLINE表示名: しゅん"), "display name cue should reach Gemini prompt");
    const savedUser = await loadUser(userKey);
    assert(!Object.hasOwn(savedUser, "lineDisplayName"), "LINE display name should not be persisted on user record");
    assert(!Object.hasOwn(savedUser, "lineDisplayNameUseAllowed"), "display name cue flag should not be persisted on user record");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAccessToken === undefined) delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    else process.env.LINE_CHANNEL_ACCESS_TOKEN = originalAccessToken;
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    if (originalModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = originalModel;
    if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
  }
}

async function callWebhookFlow() {
  const raw = JSON.stringify({ events: [] });
  assert(verifyLineSignature(Buffer.from(raw), sign(raw), process.env.LINE_CHANNEL_SECRET), "signature helper should validate");

  const invalidSigRes = createRes();
  await webhook(createWebhookReq({ events: [] }, "bad"), invalidSigRes);
  assert(invalidSigRes.statusCode === 401, "invalid LINE signature should be rejected");

  const lineUserId = "U_VALIDATE_LINE_USER";
  const userKey = makeUserKey(lineUserId);
  const followRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "follow",
      replyToken: "reply-follow",
      source: { type: "user", userId: "U_FOLLOW_USER" }
    }]
  }), followRes);
  assert(followRes.statusCode === 200, "follow webhook should return 200");
  const followUser = await loadUser(makeUserKey("U_FOLLOW_USER"));
  assert(followUser?.source === "line", "follow should create a default LINE user");

  const replyRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-normal",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "1", text: "今日は少し相談したい" }
    }]
  }), replyRes);
  assert(replyRes.statusCode === 200, "direct message should return 200");
  const linkedUser = await loadUser(userKey);
  assert(linkedUser?.source === "line", "direct message should create a default LINE user");
  assert(JSON.stringify(linkedUser).includes(lineUserId) === false, "raw LINE userId should not be stored");
  let conversation = await loadConversation(userKey);
  assert(!conversation.messages.at(-1).text.includes("テストモビー"), "mock reply should not foreground diagnosis result");
  assert(conversation.messages.at(-1).text.includes("今日は少し相談したい"), "mock reply should respond to user message");

  const crisisText = "\u3082\u3046\u7121\u7406\u3001\u6d88\u3048\u305f\u3044";
  assert(detectSafetyRisk(crisisText).hasRisk, "safety detector should catch crisis text");
  assert(!detectSafetyRisk("もう無理、助けて").hasRisk, "safety detector should let broad crisis words go to AI");
  assert(!detectSafetyRisk("SNS監視が不安").hasRisk, "safety detector should let broad stalking words go to AI");
  assert(!detectSafetyRisk("位置情報が気になる").hasRisk, "safety detector should let location anxiety go to AI");
  assert(detectSafetyRisk("殺したい").hasRisk, "safety detector should catch explicit violence text");
  assert(detectSafetyRisk("死にたい").hasRisk, "safety detector should catch explicit self-harm text");
  const safetyRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-safety",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "4", text: crisisText }
    }]
  }), safetyRes);
  conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("\u3072\u3068\u308a\u3067\u62b1\u3048\u305a"), "safety reply should be fixed safe text");

  await saveUser(userKey, {
    ...linkedUser,
    messageCountDate: todayKey(),
    messageCountToday: 50
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [] });
  const recoveredRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-recovered",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "5", text: "旧上限から戻れるか確認" }
    }]
  }), recoveredRes);
  conversation = await loadConversation(userKey);
  assert(!conversation.messages.at(-1).text.includes("\u4eca\u65e5\u306f\u3053\u3053\u307e\u3067"), "old user limit should recover under the doubled limit");
  assert(conversation.messages.at(-1).text.includes("旧上限から戻れるか確認"), "old limit recovery should produce a normal reply");

  await saveUser(userKey, {
    ...linkedUser,
    messageCountDate: todayKey(),
    messageCountToday: 100
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [] });
  const rateRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-rate",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "6", text: "\u666e\u901a\u306e\u76f8\u8ac7\u3067\u3059" }
    }]
  }), rateRes);
  conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("\u4eca\u65e5\u306f\u3053\u3053\u307e\u3067"), "rate limit reply should be used");

  await saveUser(userKey, {
    ...linkedUser,
    messageCountDate: todayKey(),
    messageCountToday: 0
  });
  await saveConversation(userKey, { version: 1, userKey, messages: [], dailyCountDate: todayKey(), dailyCount: 1000 });
  const globalRateRes = createRes();
  await webhook(createWebhookReq({
    events: [{
      type: "message",
      replyToken: "reply-global-rate",
      source: { type: "user", userId: lineUserId },
      message: { type: "text", id: "7", text: "\u5168\u4f53\u4e0a\u9650\u306e\u78ba\u8a8d\u3067\u3059" }
    }]
  }), globalRateRes);
  conversation = await loadConversation(userKey);
  assert(conversation.messages.at(-1).text.includes("\u4eca\u65e5\u306f\u3053\u3053\u307e\u3067"), "global rate limit reply should be used at doubled limit");
}

function callRateLimitDateFlow() {
  const utcDate = new Date("2026-01-01T15:30:00.000Z");
  assert(todayKey(utcDate) === "2026-01-02", "rate limit day key should use Japan time");
  assert(canReply({ messageCountDate: "2026-01-01", messageCountToday: 100 }, utcDate).ok, "JST date rollover should reset user count");
  assert(!canReply({ messageCountDate: "2026-01-02", messageCountToday: 100 }, utcDate).ok, "doubled user limit should block at 100");
  assert(!canReplyGlobally({ dailyCountDate: "2026-01-02", dailyCount: 1000 }, utcDate).ok, "doubled global limit should block at 1000");
}

async function callEmojiTailWebhookFlow() {
  const originalFetch = globalThis.fetch;
  const originalAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = "U_EMOJI_TAIL_USER";
  const userKey = makeUserKey(lineUserId);
  const emojiTailText = `${"あ".repeat(47)}😊`;
  const sentReplies = [];

  try {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "line-access-token-test";
    globalThis.fetch = async (url, options) => {
      if (String(url) === "https://api.line.me/v2/bot/message/reply") {
        sentReplies.push(JSON.parse(options.body));
      }
      return {
        ok: true,
        status: 200,
        async text() {
          return "";
        }
      };
    };

    const res = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-emoji-tail",
        source: { type: "user", userId: lineUserId },
        message: { type: "text", id: "emoji-1", text: emojiTailText }
      }]
    }), res);

    assert(res.statusCode === 200, "emoji-tail webhook should return 200");
    assert(sentReplies.length === 1, "emoji-tail webhook should send a LINE reply");
    const replyText = sentReplies[0]?.messages?.[0]?.text || "";
    assert(!hasUnpairedSurrogate(replyText), "emoji-tail LINE reply should not contain broken surrogate pairs");
    assert(replyText.includes("😊"), "emoji-tail LINE reply should preserve the user's trailing emoji");

    const conversation = await loadConversation(userKey);
    assert(!hasUnpairedSurrogate(conversation.messages.at(-2)?.text), "emoji-tail user message should be stored safely");
    assert(!hasUnpairedSurrogate(conversation.messages.at(-1)?.text), "emoji-tail assistant message should be stored safely");

    const longLineMessage = toLineTextMessage(`${"a".repeat(4999)}😊`);
    assert(!hasUnpairedSurrogate(longLineMessage.text), "LINE text truncation should not split emoji pairs");
    assert(longLineMessage.text.endsWith("😊"), "LINE text truncation should preserve boundary emoji");
    assert(cleanUnicodeText("ok\ud83d") === "ok", "unicode cleaner should remove dangling high surrogate");
    assert(truncateText(`${"b".repeat(2)}😊`, 3).endsWith("😊"), "unicode truncation should count emoji as one character");
    assert(stripEmojiForFallback("やっほー😊").includes("😊") === false, "fallback text should remove unicode emoji");

    const lineEmojiMessage = {
      type: "text",
      text: "やっほー(love)",
      emojis: [{ index: 4, length: 6, productId: "test-product", emojiId: "001" }]
    };
    assert(normalizeLineMessageText(lineEmojiMessage) === "やっほー絵文字", "LINE emoji metadata should be normalized for AI input");

    const lineEmojiRes = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-line-emoji-tail",
        source: { type: "user", userId: lineUserId },
        message: { ...lineEmojiMessage, id: "emoji-2" }
      }]
    }), lineEmojiRes);
    assert(lineEmojiRes.statusCode === 200, "LINE emoji-tail webhook should return 200");

    const retryReplies = [];
    globalThis.fetch = async (url, options) => {
      if (String(url) === "https://api.line.me/v2/bot/message/reply") {
        const payload = JSON.parse(options.body);
        retryReplies.push(payload);
        const text = payload.messages?.[0]?.text || "";
        if (text.includes("😊")) {
          return {
            ok: false,
            status: 400,
            async text() {
              return "invalid emoji";
            }
          };
        }
      }
      return {
        ok: true,
        status: 200,
        async text() {
          return "";
        }
      };
    };

    const retryRes = createRes();
    await webhook(createWebhookReq({
      events: [{
        type: "message",
        replyToken: "reply-emoji-retry",
        source: { type: "user", userId: "U_EMOJI_RETRY_USER" },
        message: { type: "text", id: "emoji-3", text: "やっほー😊" }
      }]
    }), retryRes);
    assert(retryRes.statusCode === 200, "emoji retry webhook should return 200");
    assert(retryReplies.length === 2, "emoji rejected reply should be retried once");
    assert(retryReplies[0].messages[0].text.includes("😊"), "first emoji retry attempt should include generated emoji text");
    assert(!retryReplies[1].messages[0].text.includes("😊"), "fallback retry should remove emoji-like characters");
  } finally {
    globalThis.fetch = originalFetch;
    process.env.LINE_CHANNEL_ACCESS_TOKEN = originalAccessToken;
  }
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
    source: "line",
    sourceLabel: "LINE直接",
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
    source: "line",
    sourceLabel: "LINE直接"
  };
  const personalUser = {
    source: "16love",
    sourceLabel: "メンヘラモビー診断",
    resultId: "あつすひ",
    resultName: "返信こないと死モビー",
    resultSummary: "好きな人の返信が命綱のように感じやすいタイプ。",
    traits: ["恋愛メンヘラ度: Lv.6", "恋の依存度: 彼氏ガチ勢"],
    personalResultLinked: true
  };

  try {
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_API_KEY = "test-gemini-key";

    let geminiCall = 0;
    globalThis.fetch = async (url, options) => {
      geminiCall += 1;
      assert(String(url).includes("gemini-2.5-flash-lite:generateContent"), "Gemini URL should include selected model");
      assert(options?.headers?.["x-goog-api-key"] === "test-gemini-key", "Gemini request should include API key header");
      const payload = JSON.parse(options.body);
      const systemPrompt = payload.system_instruction.parts[0].text;
      if (geminiCall === 1) {
        assert(systemPrompt.includes("MobbyのLINE AI「モビー」"), "Gemini prompt should use unified Mobby persona name");
        assert(!systemPrompt.includes("優しいモビー"), "Gemini prompt should not rename Mobby as kind Mobby");
        assert(!systemPrompt.includes("テスト恋愛モビー"), "Gemini prompt should not include saved personal diagnosis result");
        assert(systemPrompt.includes("診断タイプごとに人格や口調を変えない"), "Gemini prompt should not vary persona by diagnosis");
        assert(systemPrompt.includes("絵文字を自然に1〜2個使う"), "Gemini prompt should allow a few emoji");
        assert(systemPrompt.includes("自然で話しやすい会話"), "Gemini prompt should include conversational tone rule");
        assert(systemPrompt.includes("AIっぽい定型文や説明口調を避ける"), "Gemini prompt should avoid formulaic AI tone");
        assert(!systemPrompt.includes("共感 → 状況整理 → 小さい提案"), "Gemini prompt should not force a formulaic reply structure");
        assert(payload.contents.at(-1).parts[0].text === "LINE文面を考えたい", "Gemini request should include user message");
      } else if (geminiCall === 2) {
        assert(systemPrompt.includes("返信こないと死モビー"), "Gemini prompt should include linked personal result name");
        assert(systemPrompt.includes("好きな人の返信が命綱"), "Gemini prompt should include linked personal result summary");
        assert(systemPrompt.includes("ユーザー個別の診断結果背景"), "Gemini prompt should separate personal diagnosis context");
        assert(!systemPrompt.includes("個別結果はLINEでは保持・参照しない"), "Gemini prompt should not use old no-personal-result rule");
        assert(payload.contents.at(-1).parts[0].text === "LINE文面を考えたい", "Gemini request should include personal user message");
      } else {
        assert(systemPrompt.includes("診断知識"), "Gemini prompt should include diagnosis knowledge for diagnosis questions");
        assert(systemPrompt.includes("推し活モビー診断"), "Gemini prompt should include matched diagnosis knowledge");
        assert(systemPrompt.includes("現場至上主義"), "Gemini prompt should include type list knowledge");
        assert(payload.contents.at(-1).parts[0].text === "推し活のタイプ一覧教えて", "Gemini request should include diagnosis question");
      }
      return {
        ok: true,
        async json() {
          return {
            candidates: [{
              content: {
                parts: [{
                  text: geminiCall === 1
                    ? "その文面、やさしさはあるよ。少しだけ軽くして、相手が返しやすい一言にしよう。"
                    : geminiCall === 2
                      ? "返信待ちで不安になりやすい前提なら、責めない短文がよさそう。"
                      : "推し活モビー診断は16タイプあるよ。気になる名前を言ってくれたら詳しく見るね。"
                }]
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

    const geminiPersonalReply = await generateGeminiReply({
      user: personalUser,
      message: "LINE文面を考えたい",
      history: []
    });
    assert(geminiPersonalReply.includes("責めない短文"), "Gemini reply should return personal-context model text");

    const geminiKnowledgeReply = await generateGeminiReply({
      user: { source: "line" },
      message: "推し活のタイプ一覧教えて",
      history: []
    });
    assert(geminiKnowledgeReply.includes("16タイプ"), "Gemini knowledge reply should return model text");

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
    assert(!fallbackReply.includes("テスト恋愛モビー"), "Gemini fallback should not foreground diagnosis result");
    assert(fallbackReply.includes("LINE文面を考えたい"), "Gemini failure should fall back to mock reply");
    assert(fallbackReply.includes("🙂"), "Gemini fallback should include a small emoji");
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
process.env.LIFF_ID = process.env.LIFF_ID || "liff-id-test";
process.env.LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID || "line-login-channel-id-test";
process.env.LINE_LOGIN_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET || "line-login-channel-secret-test";
process.env.LINE_AI_PERSONAL_RESULT_LINKING = "true";
process.env.VERCEL_ENV = process.env.VERCEL_ENV === "production" ? "development" : (process.env.VERCEL_ENV || "development");
process.env.AI_PROVIDER = "mock";
delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
delete process.env.BLOB_READ_WRITE_TOKEN;

await callHealth();
await callLineAddInfo();
await callLineAddInfoIgnoresDiagnosis();
await callLinkSessionFlow();
await callLiffLinkFlow();
await callLiffPageStaticCheck();
await callSharedCtaStaticCheck();
await callKnowledgeReplyFlow();
await callCompatibilityReplyFlow();
await callDisplayNameCueFlow();
await callWebhookFlow();
callRateLimitDateFlow();
await callEmojiTailWebhookFlow();
await callWebhookMarkAsReadFlow();
await callGeminiProviderFlow();

console.log("LINE AI Mobby MVP-2 validation passed");
