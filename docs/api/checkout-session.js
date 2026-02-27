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
  const stripeSetCatalogId = process.env.STRIPE_PRICE_ID_WIN_PLUSH_SET || "";
  const stripePriceIdSingle = process.env.STRIPE_PRICE_ID_WIN_PLUSH_SINGLE || "";

  if (!stripeSecretKey || !stripePublishableKey) {
    return res.status(500).json({
      error:
        "Stripe env is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY."
    });
  }

  try {
    const body = req.body || {};
    const name = safeText(body.name, 120);
    const email = safeText(body.email, 254);
    const source = safeText(body.source || "win", 40);
    const rawProductType = safeText(body.productType || "plush_keyholder_set_with_acrylic", 80).toLowerCase();
    const isSingleProduct = rawProductType === "plush_keyholder";
    const productType = isSingleProduct ? "plush_keyholder" : "plush_keyholder_set_with_acrylic";
    const productLabel = safeText(
      body.productLabel || (isSingleProduct
        ? "ぬいぐるみキーホルダー（単体 ¥4,800）"
        : "ぬいぐるみキーホルダー＋アクリルセット（¥5,200）"),
      120
    );
    const setUsesPriceId = stripeSetCatalogId.startsWith("price_");
    const setUsesProductId = stripeSetCatalogId.startsWith("prod_");
    const singleUsesPriceId = stripePriceIdSingle.startsWith("price_");

    if (!singleUsesPriceId) {
      return res.status(500).json({
        error: "Stripe price for single product is missing. Set STRIPE_PRICE_ID_WIN_PLUSH_SINGLE=price_..."
      });
    }

    if (!isSingleProduct && !setUsesPriceId && !setUsesProductId) {
      return res.status(500).json({
        error: "Set STRIPE_PRICE_ID_WIN_PLUSH_SET to price_... or prod_... for acrylic set."
      });
    }

    const requiresEmail = !isSingleProduct;
    const hasEmail = email.length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (requiresEmail && !emailOk) {
      return res.status(400).json({ error: "email is required for acrylic set purchase" });
    }
    if (!requiresEmail && hasEmail && !emailOk) {
      return res.status(400).json({ error: "email is invalid" });
    }

    const origin = resolveOrigin(req);
    const returnUrl = `${origin}/win.html?checkout=complete`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("ui_mode", "embedded");
    form.set("line_items[0][quantity]", "1");
    if (isSingleProduct) {
      form.set("line_items[0][price]", stripePriceIdSingle);
    } else if (setUsesPriceId) {
      form.set("line_items[0][price]", stripeSetCatalogId);
    } else {
      // Allow using a product id (prod_...) for the acrylic set at fixed 5,200 JPY.
      form.set("line_items[0][price_data][currency]", "jpy");
      form.set("line_items[0][price_data][unit_amount]", "5200");
      form.set("line_items[0][price_data][product]", stripeSetCatalogId);
    }
    if (emailOk) {
      form.set("customer_email", email);
    }
    form.set("allow_promotion_codes", "true");
    form.set("redirect_on_completion", "if_required");
    form.set("return_url", returnUrl);
    form.set("metadata[source]", source);
    form.set("metadata[product_type]", productType);
    form.set("metadata[product_label]", productLabel);
    form.set("metadata[catalog_ref]", isSingleProduct ? stripePriceIdSingle : stripeSetCatalogId);
    if (name) {
      form.set("metadata[nickname]", name);
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
      sessionId: stripeData.id || ""
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
