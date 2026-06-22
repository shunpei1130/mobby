import crypto from "crypto";
import { createPaidGachaDraw } from "./_gacha-paid-result.js";

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseStripeSignature(header) {
  return String(header || "").split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      if (!acc[key]) acc[key] = [];
      acc[key].push(value);
    }
    return acc;
  }, {});
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parsed = parseStripeSignature(signatureHeader);
  const timestamp = parsed.t?.[0] || "";
  const signatures = parsed.v1 || [];
  if (!timestamp || !signatures.length) return false;

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return signatures.some((signature) => {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_GACHA_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).json({ error: "Stripe webhook env is not configured" });
  }

  try {
    const rawBody = await readRawBody(req);
    const signatureHeader = req.headers["stripe-signature"];
    if (!verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    if (event?.type === "checkout.session.completed" || event?.type === "checkout.session.async_payment_succeeded") {
      const session = event.data?.object;
      await createPaidGachaDraw({ stripeSecretKey, sessionId: session?.id, stripeSession: session });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[GACHA STRIPE WEBHOOK] Error:", error);
    return res.status(500).json({ error: error?.message || "Internal Error" });
  }
}
