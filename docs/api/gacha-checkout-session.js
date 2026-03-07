const GACHA_PRODUCT_TYPE = "gacha_fifty_pack";
const GACHA_PRODUCT_LABEL = "モビーガチャ 50連（¥2,000）";
const GACHA_PRODUCT_DESCRIPTION = "MOBBY CAPSULE CLUBで使える50連ガチャ1セット";
const GACHA_FIFTY_PACK_AMOUNT_JPY = 2000;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function resolveOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  if (!host) return "https://www.mobby.online";
  return `${proto}://${host}`;
}

function safeText(value, max = 200) {
  return String(value || "").trim().slice(0, max);
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
  const stripeCatalogRef = process.env.STRIPE_PRICE_ID_GACHA_FIFTY_PACK || "";

  if (!stripeSecretKey || !stripePublishableKey) {
    return res.status(500).json({
      error: "Stripe env is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.",
    });
  }

  try {
    const body = req.body || {};
    const source = safeText(body.source || "gacha", 40);
    const origin = resolveOrigin(req);
    const returnUrl = `${origin}/gacha/index.html?session_id={CHECKOUT_SESSION_ID}`;

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
      form.set("line_items[0][price_data][unit_amount]", String(GACHA_FIFTY_PACK_AMOUNT_JPY));
      if (stripeCatalogRef.startsWith("prod_")) {
        form.set("line_items[0][price_data][product]", stripeCatalogRef);
      } else {
        form.set("line_items[0][price_data][product_data][name]", GACHA_PRODUCT_LABEL);
        form.set("line_items[0][price_data][product_data][description]", GACHA_PRODUCT_DESCRIPTION);
      }
    }

    form.set("metadata[source]", source);
    form.set("metadata[product_type]", GACHA_PRODUCT_TYPE);
    form.set("metadata[product_label]", GACHA_PRODUCT_LABEL);
    form.set("metadata[grant_count]", "1");
    if (stripeCatalogRef) {
      form.set("metadata[catalog_ref]", stripeCatalogRef);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
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
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}