import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
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
      console.error("[SasPay Webhook] SASPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature or timestamp header" }, { status: 401 });
    }
    if (!isSaspayWebhookValid(rawBody, signature, timestamp, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event || payload.type;
    const data = payload.data || {};

    const isSuccess =
      event === "checkout.session.completed" ||
      event === "payment.success" ||
      event === "payment.approved" ||
      data.status === "SUCCESS" ||
      data.status === "COMPLETED";

    if (!isSuccess) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const metadata = data.metadata || payload.metadata || {};
    const organizationId = String(metadata.organizationId || "");
    const plan = String(metadata.plan || "").toUpperCase() as SubscriptionPlanType;
    const paymentRef = String(data.id || data.transaction_id || "");

    if (!organizationId || !dataStore.getOrganizationById(organizationId)) {
      return NextResponse.json({ error: "Organisation inconnue dans les métadonnées." }, { status: 400 });
    }
    if (plan !== "STARTER" && plan !== "PRO" && plan !== "AGENCE") {
      return NextResponse.json({ error: "Forfait invalide dans les métadonnées." }, { status: 400 });
    }
    if (!paymentRef) {
      return NextResponse.json({ error: "Référence de paiement manquante." }, { status: 400 });
    }

    const org = dataStore.getOrganization(organizationId);
    if (org.lastPaymentId === paymentRef) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    dataStore.activateSubscription(organizationId, plan, paymentRef, 30);
    dataStore.audit({
      organizationId,
      action: "SUBSCRIPTION_ACTIVATED",
      entity: "Subscription",
      entityId: paymentRef,
      metadata: { plan, source: "saspay_webhook" },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[SasPay Webhook Error]", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 400 });
  }
}
