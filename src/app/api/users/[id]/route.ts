import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { userUpdateSchema } from "@/lib/validation";
import {
  canManageOrganization,
  errorResponse,
  getClientIp,
  requireAuth,
  sanitizeUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireAuth();
    const { id } = await params;

    if (id !== user.id && !canManageOrganization(user.role)) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez modifier que votre propre profil." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const updated = await dataStore.updateUser(organization.id, id, {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email === "" ? undefined : parsed.data.email,
      avatarUrl: parsed.data.avatarUrl,
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "USER_UPDATED",
      entity: "User",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: sanitizeUser(updated) });
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
    if (!canManageOrganization(user.role)) {
      return NextResponse.json({ success: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
    const { id } = await params;
    await dataStore.deleteUser(organization.id, id);

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "USER_DELETED",
      entity: "User",
      entityId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
