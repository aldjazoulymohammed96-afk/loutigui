import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataStore } from "@/lib/data-store";
import { createSaspayCheckoutSession, SUBSCRIPTION_PLANS } from "@/lib/saspay";
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

    if (!sessionRes.success || !sessionRes.checkoutUrl) {
      return NextResponse.json(
        { success: false, error: sessionRes.error || "Impossible d'initier la session de paiement SasPay." },
        { status: 502 }
      );
    }

    dataStore.audit({
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
