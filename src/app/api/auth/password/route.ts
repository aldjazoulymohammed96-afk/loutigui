import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { changePasswordSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(parsed.data.newPassword);
    if (strength) {
      return NextResponse.json({ success: false, error: strength }, { status: 400 });
    }

    await dataStore.changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_PASSWORD_CHANGED",
      entity: "User",
      entityId: user.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: { changed: true } });
  } catch (error) {
    return errorResponse(error);
  }
}
