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
  const stripePriceId = process.env.STRIPE_PRICE_ID_WIN_PLUSH_SET || "";

  if (!stripeSecretKey || !stripePublishableKey || !stripePriceId) {
    return res.status(500).json({
      error:
        "Stripe env is not configured. Set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_ID_WIN_PLUSH_SET."
    });
  }

  try {
    const body = req.body || {};
    const name = safeText(body.name, 120);
    const email = safeText(body.email, 254);
    const source = safeText(body.source || "win", 40);
    const productType = safeText(body.productType || "plush_keyholder_set_with_acrylic", 80);
    const productLabel = safeText(body.productLabel || "ぬいぐるみキーホルダー（アクリル特典付き）", 120);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ error: "email is invalid" });
    }

    const origin = resolveOrigin(req);
    const returnUrl = `${origin}/win.html?checkout=complete`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("ui_mode", "embedded");
    form.set("line_items[0][price]", stripePriceId);
    form.set("line_items[0][quantity]", "1");
    form.set("customer_email", email);
    form.set("allow_promotion_codes", "true");
    form.set("redirect_on_completion", "if_required");
    form.set("return_url", returnUrl);
    form.set("metadata[source]", source);
    form.set("metadata[product_type]", productType);
    form.set("metadata[product_label]", productLabel);
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
