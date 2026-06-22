import { createPaidGachaDraw, GACHA_PRODUCT_TYPE, safeText } from "./_gacha-paid-result.js";

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
  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Stripe env is not configured. Set STRIPE_SECRET_KEY." });
  }

  try {
    const sessionId = safeText(req.body?.sessionId, 200);
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "sessionId is invalid" });
    }

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${stripeSecretKey}` }
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
    let draw = null;

    if (paid) {
      draw = await createPaidGachaDraw({ stripeSession: stripeData });
    }

    return res.status(200).json({
      ok: true,
      paid,
      productType,
      paymentStatus,
      checkoutStatus,
      amountTotal: Number(stripeData?.amount_total || 0),
      currency: safeText(stripeData?.currency, 12).toLowerCase(),
      pulls: Number(stripeData?.metadata?.pulls || 1),
      packageType: safeText(stripeData?.metadata?.package_type, 20),
      drawId: safeText(stripeData?.metadata?.draw_id, 120),
      resultReady: Boolean(draw?.status === "paid_result_fixed"),
      message: paid ? "" : "決済がまだ完了していません。"
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
