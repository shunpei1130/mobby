const GACHA_PRODUCT_TYPE = "gacha_fifty_pack";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
    const paymentStatus = safeText(stripeData?.payment_status, 40).toLowerCase();
    const checkoutStatus = safeText(stripeData?.status, 40).toLowerCase();
    const paid = productType === GACHA_PRODUCT_TYPE && paymentStatus === "paid";

    let message = "";
    if (productType !== GACHA_PRODUCT_TYPE) {
      message = "50連の決済として確認できませんでした。";
    } else if (paymentStatus !== "paid") {
      message = checkoutStatus === "complete"
        ? "決済は完了していますが、入金確認待ちです。時間をおいて再読み込みしてください。"
        : "決済はまだ完了していません。";
    }

    return res.status(200).json({
      ok: true,
      paid,
      productType,
      paymentStatus,
      checkoutStatus,
      amountTotal: Number(stripeData?.amount_total || 0),
      currency: safeText(stripeData?.currency, 12).toLowerCase(),
      message,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}