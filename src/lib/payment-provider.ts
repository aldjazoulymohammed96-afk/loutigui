import crypto from "crypto";

/**
 * Payment gateway abstraction.
 *
 * No payment is ever confirmed locally. A payment can only become CONFIRMED
 * after a signed webhook from the configured provider. When no provider is
 * configured, the API answers 503 with an explicit message instead of faking
 * a successful transaction.
 */

export interface PaymentProviderStatus {
  configured: boolean;
  provider: string;
  missing: string[];
  mode: "live" | "test" | "none";
}

export interface PaymentIntentInput {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  checkoutUrl: string;
  providerReference: string;
  provider: string;
}

export class PaymentNotConfiguredError extends Error {
  missing: string[];
  constructor(missing: string[]) {
    super(
      "Le paiement en ligne n'est pas configuré. Renseignez PAYMENT_PROVIDER, PAYMENT_API_URL et PAYMENT_API_KEY."
    );
    this.name = "PaymentNotConfiguredError";
    this.missing = missing;
  }
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

export function getPaymentProviderStatus(): PaymentProviderStatus {
  const provider = env("PAYMENT_PROVIDER");
  const url = env("PAYMENT_API_URL");
  const key = env("PAYMENT_API_KEY");
  const missing: string[] = [];
  if (!provider) missing.push("PAYMENT_PROVIDER");
  if (!url) missing.push("PAYMENT_API_URL");
  if (!key) missing.push("PAYMENT_API_KEY");

  return {
    configured: missing.length === 0,
    provider: provider || "non configuré",
    missing,
    mode: !provider ? "none" : env("PAYMENT_MODE") === "live" ? "live" : "test",
  };
}

/**
 * Create a hosted checkout session through the configured gateway.
 * The generic contract is: POST PAYMENT_API_URL with a bearer token and a JSON
 * body, expecting `{ checkoutUrl, reference }` (or `{ data: { ... } }`).
 */
export async function createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
  const status = getPaymentProviderStatus();
  if (!status.configured) {
    throw new PaymentNotConfiguredError(status.missing);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(env("PAYMENT_API_URL"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env("PAYMENT_API_KEY")}`,
      },
      body: JSON.stringify({
        provider: env("PAYMENT_PROVIDER"),
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        description: input.description,
        customer: {
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail,
        },
        return_url: input.returnUrl,
        metadata: input.metadata || {},
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { checkoutUrl?: string; checkout_url?: string; reference?: string; data?: Record<string, unknown>; message?: string }
      | null;

    if (!res.ok) {
      throw new Error(json?.message || `Le fournisseur de paiement a répondu HTTP ${res.status}.`);
    }

    const checkoutUrl =
      json?.checkoutUrl ||
      json?.checkout_url ||
      (typeof json?.data?.checkoutUrl === "string" ? json.data.checkoutUrl : undefined);
    const reference =
      json?.reference ||
      (typeof json?.data?.reference === "string" ? json.data.reference : undefined) ||
      input.reference;

    if (!checkoutUrl) {
      throw new Error("Le fournisseur de paiement n'a pas renvoyé d'URL de paiement.");
    }

    return { checkoutUrl, providerReference: reference, provider: env("PAYMENT_PROVIDER") };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verify the HMAC signature of an incoming payment webhook.
 * Header format: `x-payment-signature: sha256=<hex>` over the raw body.
 */
export function verifyPaymentWebhook(rawBody: string, signature: string | null): boolean {
  const secret = env("PAYMENT_WEBHOOK_SECRET");
  if (!secret || !signature) return false;
  const provided = signature.replace(/^sha256=/, "").trim();
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
