import { NextRequest, NextResponse } from "next/server";
import { Organization } from "@/types";
import { dataStore } from "@/lib/data-store";
import { organizationPatchSchema } from "@/lib/validation";
import {
  canManageOrganization,
  errorResponse,
  getClientIp,
  requireAuth,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageOrganization(user.role)) {
      return NextResponse.json(
        { success: false, error: "Seul un administrateur peut modifier les paramètres de l'organisation." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = organizationPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    // Explicit allowlist: subscription fields can never be changed through this
    // endpoint. `settings` is merged deeply instead of being replaced.
    const { settings, ...orgFields } = parsed.data;
    const updates: Partial<Organization> = { ...orgFields };
    if (settings) {
      updates.settings = { ...organization.settings, ...settings };
    }

    const updated = dataStore.updateOrganization(organization.id, updates);

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "ORGANIZATION_UPDATED",
      entity: "Organization",
      entityId: organization.id,
      metadata: { fields: Object.keys(updates) },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
