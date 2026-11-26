import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { paymentIntentSchema } from "@/lib/validation";
import { errorResponse, requireAuth } from "@/lib/auth";
import {
  PaymentNotConfiguredError,
  createPaymentIntent,
  getPaymentProviderStatus,
} from "@/lib/payment-provider";

export const dynamic = "force-dynamic";

/**
 * Create a hosted checkout session for a real Mobile Money payment.
 * No payment is confirmed here: confirmation only happens through the signed
 * provider webhook at /api/webhooks/payments.
 */
export async function POST(request: NextRequest) {
  try {
    const { organization } = await requireAuth();

    const status = getPaymentProviderStatus();
    if (!status.configured) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error:
            "Le paiement en ligne n'est pas encore activé sur cette instance. Contactez votre gestionnaire pour régler par un autre moyen.",
          missing: status.missing,
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = paymentIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const installment = await dataStore.getInstallment(organization.id, parsed.data.installmentId);
    if (!installment) {
      return NextResponse.json({ success: false, error: "Échéance introuvable." }, { status: 404 });
    }
    if (installment.remainingDue <= 0) {
      return NextResponse.json({ success: false, error: "Cette échéance est déjà réglée." }, { status: 409 });
    }

    const amount = Math.min(parsed.data.amount, installment.remainingDue);
    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const reference = `LGT-${installment.id}-${Date.now()}`;

    const intent = await createPaymentIntent({
      amount,
      currency: "XOF",
      reference,
      description: `Loyer ${installment.periodLabel} · Lot ${installment.unitNumber}`,
      customerName: installment.tenantName,
      customerPhone: installment.tenantPhone,
      returnUrl: `${appUrl.replace(/\/$/, "")}/locataire?paiement=${encodeURIComponent(reference)}`,
      metadata: {
        organizationId: organization.id,
        installmentId: installment.id,
        tenantId: installment.tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: intent.checkoutUrl,
        reference: intent.providerReference,
        amount,
        provider: intent.provider,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (error instanceof PaymentNotConfiguredError) {
      return NextResponse.json(
        { success: false, configured: false, error: error.message, missing: error.missing },
        { status: 503 }
      );
    }
    return errorResponse(error);
  }
}
