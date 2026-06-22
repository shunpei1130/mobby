import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");

process.env.GACHA_LINE_LINK_SECRET = "test-gacha-link-secret";
process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-line-channel-access-token";
process.env.LINE_LOGIN_CHANNEL_ID = "2010241086";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_mock";
process.env.STRIPE_PRICE_ID_SEAL_GACHA_SINGLE = "price_1Tl6KyHycYytLGskW8dxyL2A";
process.env.STRIPE_PRICE_ID_SEAL_GACHA_TEN = "price_1Tl6LYHycYytLGskYEUAfu6r";

const lineModule = await import("../api/_gacha-line.js");
const checkoutConfig = await import("../api/_gacha-checkout-config.js");

function read(relativePath) {
  return fs.readFileSync(path.join(docsRoot, relativePath), "utf8");
}

function assertProductionConstants() {
  const lineLinkHtml = read("gacha/line-link.html");
  assert.match(lineLinkHtml, /const LIFF_ID = "2010241086-zi2RBQek"/);
  assert.match(lineLinkHtml, /const ADD_FRIEND_URL = "https:\/\/lin\.ee\/pNFlqJ6"/);
  assert.match(lineLinkHtml, /const VERIFY_ENDPOINT = "\/api\/gacha-line-verify"/);

  const vercelJson = JSON.parse(read("vercel.json"));
  assert.ok(Array.isArray(vercelJson.crons), "vercel.json must define crons");
  assert.ok(
    vercelJson.crons.some((cron) => cron.path === "/api/gacha-line-delivery-cron" && cron.schedule === "* * * * *"),
    "Vercel Cron must run gacha-line-delivery-cron every minute"
  );

  const productionSetup = read("gacha/production-setup.md");
  [
    "LINE_LOGIN_CHANNEL_ID=2010241086",
    "R2_BUCKET_NAME=mobby-gacha-results",
    "R2_PUBLIC_BASE_URL=https://pub-f89832a5567b46d2818d3109cb2a3965.r2.dev",
    "STRIPE_PRICE_ID_SEAL_GACHA_SINGLE=price_1Tl6KyHycYytLGskW8dxyL2A",
    "STRIPE_PRICE_ID_SEAL_GACHA_TEN=price_1Tl6LYHycYytLGskYEUAfu6r",
    "GACHA_LINE_DELIVERY_DELAY_SECONDS=120",
    "https://www.mobby.online/api/gacha-stripe-webhook",
    "result-images/",
    "draw-records/",
    "line-queue/"
  ].forEach((needle) => assert.ok(productionSetup.includes(needle), `missing setup item: ${needle}`));
}

function assertCheckoutPackageConfig() {
  assert.deepEqual(Object.keys(checkoutConfig.GACHA_CHECKOUT_PACKAGES).sort(), ["single", "ten"]);
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.single.pulls, 1);
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.single.amount, 100);
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.single.label, "Mobbyシールガチャ 6連");
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.ten.pulls, 10);
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.ten.amount, 500);
  assert.equal(checkoutConfig.GACHA_CHECKOUT_PACKAGES.ten.label, "Mobbyシールガチャ 60連");
  assert.equal(checkoutConfig.GACHA_STRIPE_PRICE_ENV.single, "STRIPE_PRICE_ID_SEAL_GACHA_SINGLE");
  assert.equal(checkoutConfig.GACHA_STRIPE_PRICE_ENV.ten, "STRIPE_PRICE_ID_SEAL_GACHA_TEN");
}

function assertCheckoutSessionSourceContract() {
  const source = read("api/gacha-checkout-session.js");
  [
    "import { GACHA_CHECKOUT_PACKAGES, GACHA_STRIPE_PRICE_ENV } from \"./_gacha-checkout-config.js\";",
    "verifyLineLinkToken(body.lineLinkToken)",
    "form.set(\"metadata[product_type]\", GACHA_PRODUCT_TYPE)",
    "form.set(\"metadata[package_type]\", normalizedPackageType)",
    "form.set(\"metadata[pulls]\", String(selectedPackage.pulls))",
    "form.set(\"metadata[grant_count]\", String(selectedPackage.pulls))",
    "form.set(\"metadata[draw_id]\", drawId)",
    "form.set(\"metadata[line_user_id]\", linkedLine.lineUserId)",
    "form.set(\"metadata[result_status]\", \"pending\")",
    "form.set(\"metadata[result_base_url]\", origin)"
  ].forEach((needle) => assert.ok(source.includes(needle), `missing checkout contract: ${needle}`));
  assert.match(source, /\/gacha\/spin\.html\?mode=paid&draw_id=/);
  assert.match(source, /&pulls=\$\{selectedPackage\.pulls\}&session_id=\{CHECKOUT_SESSION_ID\}/);
}

async function assertLinePushSplitting() {
  const imageItems = Array.from({ length: 10 }, (_, index) => ({
    url: `https://pub-f89832a5567b46d2818d3109cb2a3965.r2.dev/result-images/sheet-${index + 1}.png`,
    previewUrl: `https://pub-f89832a5567b46d2818d3109cb2a3965.r2.dev/result-images/sheet-${index + 1}_preview.jpg`
  }));
  const batches = lineModule.buildGachaResultLineMessageBatches(imageItems);
  assert.deepEqual(batches.map((batch) => batch.length), [5, 5, 1]);
  assert.ok(batches.every((batch) => batch.length <= lineModule.LINE_MESSAGE_LIMIT));
  assert.equal(batches[0][0].type, "text");
  assert.equal(batches[0].filter((message) => message.type === "image").length, 4);

  const linePushes = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    linePushes.push({
      url,
      retryKey: options.headers?.["X-Line-Retry-Key"],
      body: JSON.parse(options.body)
    });
    return {
      ok: true,
      async text() {
        return "";
      }
    };
  };

  try {
    await lineModule.sendGachaResultLineMessage({
      lineUserId: "U-test-line-user",
      drawId: "draw_test",
      imageItems
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(linePushes.map((push) => push.retryKey), ["draw_test-line-0", "draw_test-line-1", "draw_test-line-2"]);
  assert.deepEqual(linePushes.map((push) => push.body.messages.length), [5, 5, 1]);
  assert.ok(linePushes.every((push) => push.url === "https://api.line.me/v2/bot/message/push"));
  assert.ok(linePushes.every((push) => push.body.to === "U-test-line-user"));
}

assertProductionConstants();
assertCheckoutPackageConfig();
assertCheckoutSessionSourceContract();
await assertLinePushSplitting();

console.log("Gacha LINE delivery validation passed");
