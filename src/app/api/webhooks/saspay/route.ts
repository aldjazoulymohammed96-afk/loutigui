import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { logError } from "@/lib/logger";
import { isSaspayWebhookValid } from "@/lib/saspay";
import { claimPaymentReference, releasePaymentReference } from "@/lib/processed-payments";
import { getCheckoutSession } from "@/lib/checkout-sessions";
import { SubscriptionPlanType } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const secret = process.env.SASPAY_WEBHOOK_SECRET;

    if (!secret) {
      logError("SASPAY_WEBHOOK_SECRET n'est pas configuré.");
      return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
    }
    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature or timestamp header" }, { status: 401 });
    }
    if (!isSaspayWebhookValid(rawBody, signature, timestamp, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      data?: Record<string, unknown> & { metadata?: Record<string, string> };
      metadata?: Record<string, string>;
    };
    // Only the documented catalogue event may deliver a subscription.
    // Redirects, delays and PENDING statuses never count as a payment.
    if (payload.event !== "transaction.success") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const data = payload.data || {};
    const metadata = payload.metadata || data.metadata || {};
    // Prefer the transaction id so the checkout callback and the webhook
    // converge on the same idempotency key.
    const paymentRef = String(data.transaction_id || data.id || "");
    if (!paymentRef) {
      return NextResponse.json({ error: "Référence de paiement manquante." }, { status: 400 });
    }

    // The record written before redirecting the customer is authoritative.
    // Provider metadata is only an echo and must agree with it when present.
    const sessionId = String(metadata.sessionId || data.session_id || "");
    const localSession = sessionId ? await getCheckoutSession(sessionId) : undefined;
    const echoedOrg = String(metadata.organizationId || "");
    const organizationId = localSession?.organizationId || echoedOrg;
    if (localSession && echoedOrg && echoedOrg !== localSession.organizationId) {
      return NextResponse.json({ error: "Organisation incohérente avec la session de paiement." }, { status: 403 });
    }
    const plan = (localSession?.plan ||
      String(metadata.plan || "").toUpperCase()) as SubscriptionPlanType;

    if (!organizationId || !await dataStore.getOrganizationById(organizationId)) {
      return NextResponse.json({ error: "Organisation inconnue pour ce paiement." }, { status: 400 });
    }
    if (plan !== "STARTER" && plan !== "PRO" && plan !== "AGENCE") {
      return NextResponse.json({ error: "Forfait invalide pour ce paiement." }, { status: 400 });
    }

    // A UNIQUE row in Turso decides idempotence atomically: an old webhook
    // replayed after a newer payment can no longer grant another 30 days.
    const claimed = await claimPaymentReference({
      reference: paymentRef,
      scope: "subscription",
      organizationId,
      plan,
    });
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      await dataStore.activateSubscription(organizationId, plan, paymentRef, 30);
      await dataStore.audit({
        organizationId,
        action: "SUBSCRIPTION_ACTIVATED",
        entity: "Subscription",
        entityId: paymentRef,
        metadata: { plan, source: "saspay_webhook" },
      });
    } catch (error) {
      // Let a legitimate retry through if the business write failed.
      await releasePaymentReference(paymentRef, "subscription");
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logError("Erreur de traitement du webhook SasPay", err);
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 400 });
  }
}
