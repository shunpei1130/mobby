const GACHA_PRODUCTS = {
  gacha_single_pull: {
    label: "モビーガチャ 1回",
    amountJpy: 100,
    grantKind: "single",
    grantCount: 1,
    pullCount: 1,
  },
  gacha_ten_pull: {
    label: "モビーガチャ 10連",
    amountJpy: 500,
    grantKind: "ten",
    grantCount: 1,
    pullCount: 10,
  },
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeText(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

function safePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(1, Math.floor(num));
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
  if (!stripeSecretKey) {
    return res.status(500).json({
      error: "Stripe env is not configured. Set STRIPE_SECRET_KEY.",
    });
  }

  try {
    const body = req.body || {};
    const sessionId = safeText(body.sessionId, 200);
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "sessionId is invalid" });
    }

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    const stripeData = await stripeRes.json().catch(() => ({}));
    if (!stripeRes.ok) {
      const message =
        stripeData?.error?.message ||
        stripeData?.message ||
        "Failed to load checkout session";
      return res.status(400).json({ error: message });
    }

    const productType = safeText(stripeData?.metadata?.product_type, 80).toLowerCase();
    const product = GACHA_PRODUCTS[productType] || null;
    const paymentStatus = safeText(stripeData?.payment_status, 40).toLowerCase();
    const checkoutStatus = safeText(stripeData?.status, 40).toLowerCase();
    const amountTotal = Number(stripeData?.amount_total || 0);
    const currency = safeText(stripeData?.currency, 12).toLowerCase();
    const amountMatches = Boolean(product) && currency === "jpy" && amountTotal === product.amountJpy;
    const paid = Boolean(product) && paymentStatus === "paid" && amountMatches;

    let message = "";
    if (!product) {
      message = "ガチャ購入の決済として確認できませんでした。";
    } else if (paymentStatus === "paid" && !amountMatches) {
      message = "決済金額がガチャ購入プランと一致しませんでした。";
    } else if (paymentStatus !== "paid") {
      message = checkoutStatus === "complete"
        ? "決済は完了していますが、入金確認待ちです。時間をおいて再読み込みしてください。"
        : "決済はまだ完了していません。";
    }

    const grantKind = product?.grantKind || safeText(stripeData?.metadata?.grant_kind, 40).toLowerCase();
    const grantCount = safePositiveInt(stripeData?.metadata?.grant_count, product?.grantCount || 1);
    const pullCount = safePositiveInt(stripeData?.metadata?.pull_count, product?.pullCount || 1);

    return res.status(200).json({
      ok: true,
      paid,
      productType,
      productLabel: product?.label || "",
      grantKind,
      grantCount,
      pullCount,
      paymentStatus,
      checkoutStatus,
      amountTotal,
      currency,
      message,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
