import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { paymentCreateSchema } from "@/lib/validation";
import { canManageMoney, errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: await dataStore.getPayments(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageMoney(user.role)) {
      return NextResponse.json(
        { success: false, error: "Votre rôle ne permet pas d'enregistrer un encaissement." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = paymentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const result = await dataStore.recordPayment(organization.id, {
      ...parsed.data,
      recordedByUserId: user.id,
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "PAYMENT_RECORDED",
      entity: "Payment",
      entityId: result.payment.id,
      metadata: {
        installmentId: result.installment.id,
        amount: result.payment.amount,
        method: result.payment.paymentMethod,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
