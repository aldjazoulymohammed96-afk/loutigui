import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { tenantCreateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: dataStore.getTenants(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = tenantCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const tenant = dataStore.createTenant(organization.id, {
      ...parsed.data,
      email: parsed.data.email || undefined,
      emergencyContactPhone: parsed.data.emergencyContactPhone || undefined,
      guarantorPhone: parsed.data.guarantorPhone || undefined,
    });

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TENANT_CREATED",
      entity: "Tenant",
      entityId: tenant.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
