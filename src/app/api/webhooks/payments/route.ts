import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { Payment } from "@/types";
import { verifyPaymentWebhook } from "@/lib/payment-provider";

export const dynamic = "force-dynamic";

interface WebhookData {
  status?: string;
  transactionId?: string;
  transaction_id?: string;
  id?: string;
  amount?: number;
  provider?: Payment["provider"];
  metadata?: Record<string, string>;
}

interface PaymentWebhookPayload extends WebhookData {
  data?: WebhookData;
  metadata?: Record<string, string>;
}

const SUCCESS_STATUSES = ["SUCCESS", "COMPLETED", "APPROVED", "PAID"];

/**
 * Payment provider webhook. The only place where an online payment can become
 * CONFIRMED. The request must be signed and the transaction id must be unique
 * (idempotent replay protection).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature");

  if (!verifyPaymentWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let payload: PaymentWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaymentWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const data = payload.data || payload;
  const status = String(data.status || payload.status || "").toUpperCase();
  const metadata = data.metadata || payload.metadata || {};
  const organizationId = String(metadata.organizationId || "");
  const installmentId = String(metadata.installmentId || "");
  const transactionId = String(
    data.transactionId || data.transaction_id || data.id || payload.id || ""
  );
  const amount = Number(data.amount ?? payload.amount);

  if (!organizationId || !installmentId) {
    return NextResponse.json(
      { error: "Métadonnées organizationId/installmentId manquantes." },
      { status: 400 }
    );
  }

  if (!SUCCESS_STATUSES.includes(status)) {
    // Acknowledge non-final events so the provider stops retrying.
    return NextResponse.json({ received: true, ignored: status });
  }

  if (!transactionId) {
    return NextResponse.json({ error: "Référence de transaction manquante." }, { status: 400 });
  }

  // Idempotency: never record the same provider transaction twice.
  const already = dataStore
    .getPayments(organizationId)
    .some((p) => p.externalTransactionRef === transactionId);
  if (already) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const installment = dataStore.getInstallment(organizationId, installmentId);
  if (!installment) {
    return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
  }

  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : installment.remainingDue;

  try {
    const result = dataStore.recordPayment(organizationId, {
      installmentId,
      amount: Math.min(safeAmount, installment.remainingDue),
      paymentMethod: "MOBILE_MONEY",
      provider: data.provider,
      externalTransactionRef: transactionId,
      notes: `Paiement en ligne confirmé par webhook (${data.provider || "fournisseur"}).`,
    });

    dataStore.audit({
      organizationId,
      action: "PAYMENT_WEBHOOK_CONFIRMED",
      entity: "Payment",
      entityId: result.payment.id,
      metadata: { transactionId, amount: result.payment.amount },
    });

    return NextResponse.json({ received: true, paymentId: result.payment.id });
  } catch (error) {
    console.error("[Payment webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de traitement." },
      { status: 500 }
    );
  }
}
