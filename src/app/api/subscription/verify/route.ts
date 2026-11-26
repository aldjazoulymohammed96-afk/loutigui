import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { getSaspayCheckoutStatus, SUBSCRIPTION_PLANS } from "@/lib/saspay";
import { SubscriptionPlanType } from "@/types";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireAuth();
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de session de paiement (session_id) manquant." },
        { status: 400 }
      );
    }

    const checkRes = await getSaspayCheckoutStatus(sessionId);
    if (!checkRes.success) {
      return NextResponse.json(
        { success: false, error: checkRes.error || "Impossible de vérifier le statut sur SasPay." },
        { status: 502 }
      );
    }

    const status = (checkRes.status || "").toUpperCase();

    if (["SUCCESS", "COMPLETED", "APPROVED", "PAID"].includes(status)) {
      // Never trust the URL: the plan and organisation must come from the
      // signed provider session metadata.
      const metadataPlan = String(checkRes.raw?.metadata?.plan || "").toUpperCase();
      const metadataOrg = String(checkRes.raw?.metadata?.organizationId || "");

      if (metadataOrg && metadataOrg !== organization.id) {
        return NextResponse.json(
          { success: false, error: "Cette session de paiement appartient à une autre organisation." },
          { status: 403 }
        );
      }
      if (metadataPlan !== "STARTER" && metadataPlan !== "PRO" && metadataPlan !== "AGENCE") {
        return NextResponse.json(
          { success: false, error: "Forfait introuvable dans les métadonnées du paiement." },
          { status: 400 }
        );
      }

      const plan = metadataPlan as SubscriptionPlanType;
      if (!SUBSCRIPTION_PLANS[plan]) {
        return NextResponse.json({ success: false, error: "Forfait inconnu." }, { status: 400 });
      }

      const paymentRef = checkRes.transactionId || sessionId;
      // Idempotent activation: replaying the callback does not extend twice.
      if (organization.lastPaymentId !== paymentRef) {
        await dataStore.activateSubscription(organization.id, plan, paymentRef, 30);
      }

      return NextResponse.json({
        success: true,
        activated: true,
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
