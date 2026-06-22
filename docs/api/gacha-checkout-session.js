import crypto from "crypto";
import { GACHA_PRODUCT_TYPE, resolveOrigin, safeText } from "./_gacha-paid-result.js";
import { verifyLineLinkToken } from "./_gacha-line.js";

const PACKAGES = {
  single: {
    pulls: 1,
    amount: 100,
    label: "Mobbyシールガチャ 6連",
    description: "Mobby シールガチャ 6連"
  },
  ten: {
    pulls: 10,
    amount: 500,
    label: "Mobbyシールガチャ 60連",
    description: "Mobby シールガチャ 60連"
  }
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
  const stripeCatalogRefs = {
    single: process.env.STRIPE_PRICE_ID_SEAL_GACHA_SINGLE || "",
    ten: process.env.STRIPE_PRICE_ID_SEAL_GACHA_TEN || ""
  };

  if (!stripeSecretKey || !stripePublishableKey) {
    return res.status(500).json({
      error: "Stripe env is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY."
    });
  }

  try {
    const body = req.body || {};
    const source = safeText(body.source || "gacha", 40);
    const packageType = safeText(body.packageType || "single", 20);
    const linkedLine = verifyLineLinkToken(body.lineLinkToken);
    if (!linkedLine?.lineUserId) {
      return res.status(400).json({ error: "LINE連携を完了してから購入してください。" });
    }

    const normalizedPackageType = PACKAGES[packageType] ? packageType : "single";
    const selectedPackage = PACKAGES[normalizedPackageType];
    const stripeCatalogRef = stripeCatalogRefs[normalizedPackageType] || "";
    const origin = resolveOrigin(req);
    const drawId = `draw_${crypto.randomUUID().replace(/-/gu, "")}`;
    const returnUrl = `${origin}/gacha/spin.html?mode=paid&draw_id=${encodeURIComponent(drawId)}&pulls=${selectedPackage.pulls}&session_id={CHECKOUT_SESSION_ID}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("ui_mode", "embedded");
    form.set("locale", "ja");
    form.set("redirect_on_completion", "if_required");
    form.set("return_url", returnUrl);
    form.set("line_items[0][quantity]", "1");

    if (stripeCatalogRef.startsWith("price_")) {
      form.set("line_items[0][price]", stripeCatalogRef);
    } else {
      form.set("line_items[0][price_data][currency]", "jpy");
      form.set("line_items[0][price_data][unit_amount]", String(selectedPackage.amount));
      form.set("line_items[0][price_data][product_data][name]", selectedPackage.label);
      form.set("line_items[0][price_data][product_data][description]", selectedPackage.description);
    }

    form.set("metadata[source]", source);
    form.set("metadata[product_type]", GACHA_PRODUCT_TYPE);
    form.set("metadata[product_label]", selectedPackage.label);
    form.set("metadata[package_type]", normalizedPackageType);
    form.set("metadata[pulls]", String(selectedPackage.pulls));
    form.set("metadata[grant_count]", String(selectedPackage.pulls));
    form.set("metadata[draw_id]", drawId);
    form.set("metadata[line_user_id]", linkedLine.lineUserId);
    form.set("metadata[result_status]", "pending");
    form.set("metadata[result_base_url]", origin);
    if (stripeCatalogRef) {
      form.set("metadata[catalog_ref]", stripeCatalogRef);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    const stripeData = await stripeRes.json().catch(() => ({}));
    if (!stripeRes.ok) {
      const message =
        stripeData?.error?.message ||
        stripeData?.message ||
        "Failed to create checkout session";
      return res.status(400).json({ error: message });
    }

    if (!stripeData.client_secret) {
      return res.status(500).json({ error: "Stripe session client_secret is missing" });
    }

    return res.status(200).json({
      ok: true,
      clientSecret: stripeData.client_secret,
      publishableKey: stripePublishableKey,
      sessionId: stripeData.id || "",
      drawId
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
