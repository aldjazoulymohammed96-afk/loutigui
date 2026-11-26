import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { tenantUpdateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = tenantUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const tenant = dataStore.updateTenant(organization.id, id, {
      ...parsed.data,
      email: parsed.data.email === "" ? undefined : parsed.data.email,
      emergencyContactPhone: parsed.data.emergencyContactPhone === "" ? undefined : parsed.data.emergencyContactPhone,
      guarantorPhone: parsed.data.guarantorPhone === "" ? undefined : parsed.data.guarantorPhone,
    });

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TENANT_UPDATED",
      entity: "Tenant",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireAuth();
    const { id } = await params;
    dataStore.deleteTenant(organization.id, id);

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TENANT_DELETED",
      entity: "Tenant",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
