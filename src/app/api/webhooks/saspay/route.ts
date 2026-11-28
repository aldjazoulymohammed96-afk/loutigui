import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { logError } from "@/lib/logger";
import { isSaspayWebhookValid } from "@/lib/saspay";
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
    const organizationId = String(metadata.organizationId || "");
    const plan = String(metadata.plan || "").toUpperCase() as SubscriptionPlanType;
    const paymentRef = String(data.id || data.transaction_id || "");

    if (!organizationId || !await dataStore.getOrganizationById(organizationId)) {
      return NextResponse.json({ error: "Organisation inconnue dans les métadonnées." }, { status: 400 });
    }
    if (plan !== "STARTER" && plan !== "PRO" && plan !== "AGENCE") {
      return NextResponse.json({ error: "Forfait invalide dans les métadonnées." }, { status: 400 });
    }
    if (!paymentRef) {
      return NextResponse.json({ error: "Référence de paiement manquante." }, { status: 400 });
    }

    const org = await dataStore.getOrganization(organizationId);
    if (org.lastPaymentId === paymentRef) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await dataStore.activateSubscription(organizationId, plan, paymentRef, 30);
    await dataStore.audit({
      organizationId,
      action: "SUBSCRIPTION_ACTIVATED",
      entity: "Subscription",
      entityId: paymentRef,
      metadata: { plan, source: "saspay_webhook" },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    logError("Erreur de traitement du webhook SasPay", err);
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 400 });
  }
}
