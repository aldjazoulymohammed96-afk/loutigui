import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { maintenanceCreateSchema, maintenanceUpdateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: dataStore.getTickets(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = maintenanceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const unit = dataStore.getUnit(organization.id, parsed.data.unitId);
    if (!unit) {
      return NextResponse.json({ success: false, error: "Lot introuvable." }, { status: 404 });
    }

    // Resolve the tenant on the server. Never invent a fake tenant or phone.
    const tenantId = parsed.data.tenantId || unit.currentTenantId;
    const tenant = tenantId ? dataStore.getTenant(organization.id, tenantId) : undefined;

    const ticket = dataStore.createTicket(organization.id, {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      buildingName: unit.buildingName || "Immeuble",
      tenantId: tenant?.id || "",
      tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : "Lot vacant",
      tenantPhone: tenant?.phone || "",
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      estimatedCost: parsed.data.estimatedCost,
      vendorName: parsed.data.vendorName,
      vendorPhone: parsed.data.vendorPhone || undefined,
    });

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TICKET_CREATED",
      entity: "MaintenanceTicket",
      entityId: ticket.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ success: false, error: "Identifiant du ticket requis." }, { status: 400 });
    }

    const parsed = maintenanceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const updated = dataStore.updateTicket(organization.id, id, parsed.data);

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TICKET_UPDATED",
      entity: "MaintenanceTicket",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
