const GACHA_PRODUCTS = {
  single: {
    productType: "gacha_single_pull",
    label: "モビーガチャ 1回（¥100）",
    description: "MOBBY CAPSULE CLUBで使えるガチャ1回分",
    amountJpy: 100,
    grantKind: "single",
    grantCount: 1,
    pullCount: 1,
    catalogEnv: "STRIPE_PRICE_ID_GACHA_SINGLE_PULL",
  },
  ten: {
    productType: "gacha_ten_pull",
    label: "モビーガチャ 10連（¥500）",
    description: "MOBBY CAPSULE CLUBで使える10連ガチャ1セット",
    amountJpy: 500,
    grantKind: "ten",
    grantCount: 1,
    pullCount: 10,
    catalogEnv: "STRIPE_PRICE_ID_GACHA_TEN_PULL",
  },
};

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

function resolveProduct(body) {
  const plan = safeText(body?.plan || body?.product || body?.productType, 40).toLowerCase();
  return GACHA_PRODUCTS[plan] || GACHA_PRODUCTS.single;
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

  if (!stripeSecretKey || !stripePublishableKey) {
    return res.status(500).json({
      error: "Stripe env is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.",
    });
  }

  try {
    const body = req.body || {};
    const product = resolveProduct(body);
    const stripeCatalogRef = process.env[product.catalogEnv] || "";
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
      form.set("line_items[0][price_data][unit_amount]", String(product.amountJpy));
      if (stripeCatalogRef.startsWith("prod_")) {
        form.set("line_items[0][price_data][product]", stripeCatalogRef);
      } else {
        form.set("line_items[0][price_data][product_data][name]", product.label);
        form.set("line_items[0][price_data][product_data][description]", product.description);
      }
    }

    form.set("metadata[source]", source);
    form.set("metadata[product_type]", product.productType);
    form.set("metadata[product_label]", product.label);
    form.set("metadata[grant_kind]", product.grantKind);
    form.set("metadata[grant_count]", String(product.grantCount));
    form.set("metadata[pull_count]", String(product.pullCount));
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
      productType: product.productType,
      productLabel: product.label,
      grantKind: product.grantKind,
      grantCount: product.grantCount,
      pullCount: product.pullCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
