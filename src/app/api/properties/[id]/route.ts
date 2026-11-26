import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { buildingUpdateSchema, unitUpdateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function resourceType(request: NextRequest): "building" | "unit" | null {
  const type = request.nextUrl.searchParams.get("type");
  if (type === "building" || type === "unit") return type;
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireAuth();
    const { id } = await params;
    const type = resourceType(request);
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Paramètre « type » requis (building ou unit)." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    if (type === "building") {
      const parsed = buildingUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
          { status: 400 }
        );
      }
      const building = dataStore.updateBuilding(organization.id, id, parsed.data);
      dataStore.audit({
        organizationId: organization.id,
        userId: user.id,
        userEmail: user.email,
        action: "BUILDING_UPDATED",
        entity: "Building",
        entityId: id,
        ip: getClientIp(request),
      });
      return NextResponse.json({ success: true, data: building });
    }

    const parsed = unitUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }
    const unit = dataStore.updateUnit(organization.id, id, parsed.data);
    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "UNIT_UPDATED",
      entity: "Unit",
      entityId: id,
      ip: getClientIp(request),
    });
    return NextResponse.json({ success: true, data: unit });
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
    const type = resourceType(request);
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Paramètre « type » requis (building ou unit)." },
        { status: 400 }
      );
    }

    if (type === "building") {
      dataStore.deleteBuilding(organization.id, id);
    } else {
      dataStore.deleteUnit(organization.id, id);
    }

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: type === "building" ? "BUILDING_DELETED" : "UNIT_DELETED",
      entity: type === "building" ? "Building" : "Unit",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
