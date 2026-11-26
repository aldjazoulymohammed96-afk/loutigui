import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse, getClientIp, requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireAuth();
    dataStore.refreshInstallmentStatuses(organization.id);
    const status = request.nextUrl.searchParams.get("status") || "ALL";
    return NextResponse.json({
      success: true,
      data: dataStore.getInstallments(organization.id, status),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Manually generate the échéances of a given month (admin action). */
export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireRole(["OWNER", "AGENCY_ADMIN", "SUPER_ADMIN"]);
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const year = Number(body?.year) || now.getFullYear();
    const month = Number(body?.month) || now.getMonth() + 1;

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ success: false, error: "Période invalide." }, { status: 400 });
    }

    const created = dataStore.generateMonthlyInstallments(organization.id, year, month);

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "INSTALLMENTS_GENERATED",
      entity: "Installment",
      metadata: { year, month, count: created.length },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      data: { created: created.length, installments: created },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
