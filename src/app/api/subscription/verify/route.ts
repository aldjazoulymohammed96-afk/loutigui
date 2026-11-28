import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { getSaspayCheckoutStatus, isValidProviderId, SUBSCRIPTION_PLANS } from "@/lib/saspay";
import { getCheckoutSession } from "@/lib/checkout-sessions";
import { claimPaymentReference, releasePaymentReference } from "@/lib/processed-payments";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireAuth();
    const sessionId = request.nextUrl.searchParams.get("session_id") || "";

    if (!isValidProviderId(sessionId)) {
      return NextResponse.json(
        { success: false, error: "Identifiant de session de paiement invalide." },
        { status: 400 }
      );
    }

    // Our own pre-payment record is the source of truth: the callback URL can
    // be copied into another account, but this mapping cannot.
    const localSession = await getCheckoutSession(sessionId);
    if (!localSession || localSession.organizationId !== organization.id) {
      return NextResponse.json(
        { success: false, error: "Cette session de paiement n'appartient pas à votre organisation." },
        { status: 403 }
      );
    }

    const checkRes = await getSaspayCheckoutStatus(sessionId);
    if (!checkRes.success) {
      return NextResponse.json(
        {
          success: false,
          code: checkRes.code || "SASPAY_STATUS_CHECK_FAILED",
          error: checkRes.error || "Impossible de vérifier le statut sur SasPay.",
        },
        { status: 502 }
      );
    }

    const status = (checkRes.status || "").toUpperCase();

    if (["SUCCESS", "COMPLETED", "APPROVED", "PAID"].includes(status)) {
      const echoedOrg = String(checkRes.raw?.metadata?.organizationId || "");
      const echoedPlan = String(checkRes.raw?.metadata?.plan || "").toUpperCase();
      if (echoedOrg && echoedOrg !== organization.id) {
        return NextResponse.json(
          { success: false, error: "Cette session de paiement appartient à une autre organisation." },
          { status: 403 }
        );
      }
      if (echoedPlan && echoedPlan !== localSession.plan) {
        return NextResponse.json(
          { success: false, error: "Forfait du paiement incohérent avec la session." },
          { status: 400 }
        );
      }

      const plan = localSession.plan;
      if (!SUBSCRIPTION_PLANS[plan]) {
        return NextResponse.json({ success: false, error: "Forfait inconnu." }, { status: 400 });
      }

      const currency = String(checkRes.raw?.currency || "").toUpperCase();
      if (currency && currency !== localSession.currency.toUpperCase()) {
        return NextResponse.json(
          { success: false, error: "Devise du paiement incohérente." },
          { status: 400 }
        );
      }
      if (checkRes.raw?.net_amount !== undefined) {
        const paid = Number(checkRes.raw.net_amount);
        const expected = Number(localSession.amount);
        if (!Number.isFinite(paid) || paid <= 0 || paid > expected + 0.01) {
          return NextResponse.json(
            { success: false, error: "Montant du paiement incohérent avec le forfait." },
            { status: 400 }
          );
        }
      }

      const paymentRef = checkRes.transactionId || sessionId;
      // Atomic claim shared with the webhook: a replay cannot extend twice.
      const claimed = await claimPaymentReference({
        reference: paymentRef,
        scope: "subscription",
        organizationId: organization.id,
        plan,
      });
      let activated = false;
      if (claimed) {
        try {
          await dataStore.activateSubscription(organization.id, plan, paymentRef, 30);
          activated = true;
        } catch (error) {
          await releasePaymentReference(paymentRef, "subscription");
          throw error;
        }
      }

      return NextResponse.json({
        success: true,
        activated,
        duplicate: !claimed,
        status,
        transactionId: checkRes.transactionId,
        subscription: await dataStore.getSubscriptionInfo(organization.id),
      });
    }

    if (status === "PENDING" || status === "PROCESSING") {
      return NextResponse.json({
        success: false,
        pending: true,
        status,
        message: "Paiement en cours de traitement par l'opérateur.",
      });
    }

    return NextResponse.json({
      success: false,
      failed: true,
      status,
      message: `Paiement non complété (Statut : ${status}).`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
