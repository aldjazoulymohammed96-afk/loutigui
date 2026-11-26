import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { buildingCreateSchema, unitCreateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({
      success: true,
      data: {
        buildings: dataStore.getBuildings(organization.id),
        units: dataStore.getUnits(organization.id),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
    }

    const { action, ...data } = body as Record<string, unknown>;

    if (action === "create_building") {
      const parsed = buildingCreateSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
          { status: 400 }
        );
      }
      const building = dataStore.createBuilding(organization.id, parsed.data);
      dataStore.audit({
        organizationId: organization.id,
        userId: user.id,
        userEmail: user.email,
        action: "BUILDING_CREATED",
        entity: "Building",
        entityId: building.id,
        ip: getClientIp(request),
      });
      return NextResponse.json({ success: true, data: building }, { status: 201 });
    }

    if (action === "create_unit") {
      const parsed = unitCreateSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
          { status: 400 }
        );
      }
      const unit = dataStore.createUnit(organization.id, parsed.data);
      dataStore.audit({
        organizationId: organization.id,
        userId: user.id,
        userEmail: user.email,
        action: "UNIT_CREATED",
        entity: "Unit",
        entityId: unit.id,
        ip: getClientIp(request),
      });
      return NextResponse.json({ success: true, data: unit }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "Action non reconnue." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
