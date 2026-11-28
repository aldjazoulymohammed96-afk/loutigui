import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { userCreateSchema } from "@/lib/validation";
import {
  canManageOrganization,
  errorResponse,
  getClientIp,
  requireAuth,
  sanitizeUser,
} from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageOrganization(user.role)) {
      return NextResponse.json({ success: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
    return NextResponse.json({
      success: true,
      data: (await dataStore.getUsers(organization.id)).map(sanitizeUser),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageOrganization(user.role)) {
      return NextResponse.json({ success: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(parsed.data.password);
    if (strength) {
      return NextResponse.json({ success: false, error: strength }, { status: 400 });
    }

    const created = await dataStore.createUser(organization.id, {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      password: parsed.data.password,
      role: parsed.data.role,
    });

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "USER_CREATED",
      entity: "User",
      entityId: created.id,
      metadata: { role: created.role },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: sanitizeUser(created) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
