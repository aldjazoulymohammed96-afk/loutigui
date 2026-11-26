import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { leaseCreateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: await dataStore.getLeases(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = leaseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const lease = await dataStore.createLease(organization.id, {
      ...parsed.data,
      endDate: parsed.data.endDate || undefined,
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "LEASE_CREATED",
      entity: "Lease",
      entityId: lease.id,
      metadata: { unitId: lease.unitId, tenantId: lease.tenantId },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: lease }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
