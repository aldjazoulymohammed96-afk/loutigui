import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { resetPasswordSchema } from "@/lib/validation";
import { ApiError, errorResponse, getClientIp } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(request, "reset-password"), 10, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
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

    let user;
    try {
      user = await dataStore.resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Lien invalide.");
    }

    await dataStore.audit({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_PASSWORD_RESET",
      entity: "User",
      entityId: user.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: "Mot de passe mis à jour. Vous pouvez vous connecter." });
  } catch (error) {
    return errorResponse(error);
  }
}
