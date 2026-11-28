import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataStore } from "@/lib/data-store";
import { createSaspayCheckoutSession, SUBSCRIPTION_PLANS } from "@/lib/saspay";
import { saveCheckoutSession } from "@/lib/checkout-sessions";
import { SubscriptionPlanType } from "@/types";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  plan: z.enum(["STARTER", "PRO", "AGENCE"]),
});

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Forfait d'abonnement invalide." }, { status: 400 });
    }

    const validPlan = parsed.data.plan as SubscriptionPlanType;
    if (!SUBSCRIPTION_PLANS[validPlan]) {
      return NextResponse.json({ success: false, error: "Forfait d'abonnement invalide." }, { status: 400 });
    }

    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const finalReturnUrl = `${appUrl.replace(/\/$/, "")}/abonnement/callback?plan=${validPlan}`;

    const sessionRes = await createSaspayCheckoutSession({
      planId: validPlan,
      organizationId: organization.id,
      customerEmail: organization.email || user.email || "contact@loutigui.ci",
      customerName: organization.name || user.name,
      customerPhone: organization.phone || user.phone,
      returnUrl: finalReturnUrl,
    });

    if (
      !sessionRes.success ||
      !sessionRes.checkoutUrl ||
      !sessionRes.sessionId
    ) {
      return NextResponse.json(
        {
          success: false,
          code: sessionRes.code || "SASPAY_CHECKOUT_FAILED",
          error: sessionRes.error || "Impossible d'initier la session de paiement SasPay.",
        },
        { status: 502 }
      );
    }

    // Persist our own session -> (org, plan, amount) mapping before the customer
    // leaves the site. The callback then never has to trust echoed metadata.
    await saveCheckoutSession({
      sessionId: sessionRes.sessionId,
      organizationId: organization.id,
      plan: validPlan,
      amount: SUBSCRIPTION_PLANS[validPlan].amount,
      currency: "XOF",
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "SUBSCRIPTION_CHECKOUT_CREATED",
      entity: "Subscription",
      metadata: { plan: validPlan, sessionId: sessionRes.sessionId },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionRes.sessionId,
      checkoutUrl: sessionRes.checkoutUrl,
      plan: validPlan,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
