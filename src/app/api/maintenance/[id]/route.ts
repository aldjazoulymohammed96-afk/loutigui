import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireAuth();
    const { id } = await params;
    dataStore.deleteTicket(organization.id, id);

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "TICKET_DELETED",
      entity: "MaintenanceTicket",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
