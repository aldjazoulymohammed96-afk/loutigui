import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { leaseActionSchema, leaseUpdateSchema } from "@/lib/validation";
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

    const action = leaseActionSchema.safeParse(body);
    if (action.success) {
      let lease;
      if (action.data.action === "terminate") {
        lease = await dataStore.terminateLease(organization.id, id, action.data.endDate, action.data.reason);
      } else if (action.data.action === "renew") {
        if (!action.data.newEndDate) {
          return NextResponse.json(
            { success: false, error: "La nouvelle date de fin est obligatoire." },
            { status: 400 }
          );
        }
        lease = await dataStore.renewLease(organization.id, id, action.data.newEndDate);
      } else {
        const current = await dataStore.getLease(organization.id, id);
        if (!current) {
          return NextResponse.json({ success: false, error: "Bail introuvable." }, { status: 404 });
        }
        lease = await dataStore.updateLease(organization.id, id, { status: "NOTICE_GIVEN" });
      }

      await dataStore.audit({
        organizationId: organization.id,
        userId: user.id,
        userEmail: user.email,
        action: `LEASE_${action.data.action.toUpperCase()}`,
        entity: "Lease",
        entityId: id,
        ip: getClientIp(request),
      });

      return NextResponse.json({ success: true, data: lease });
    }

    const parsed = leaseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const lease = await dataStore.updateLease(organization.id, id, {
      ...parsed.data,
      endDate: parsed.data.endDate === "" ? undefined : parsed.data.endDate,
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "LEASE_UPDATED",
      entity: "Lease",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: lease });
  } catch (error) {
    return errorResponse(error);
  }
}
