import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { loginSchema } from "@/lib/validation";
import { buildSessionPayload, setSessionCookie } from "@/lib/session";
import { errorResponse, getClientIp, sanitizeUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(request, "login"), 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives de connexion. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const session = await dataStore.login(parsed.data.identifier, parsed.data.password);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    await setSessionCookie(
      buildSessionPayload({
        userId: session.user.id,
        organizationId: session.user.organizationId,
        role: session.user.role,
      })
    );

    await dataStore.audit({
      organizationId: session.organization.id,
      userId: session.user.id,
      userEmail: session.user.email,
      action: "AUTH_LOGIN",
      entity: "User",
      entityId: session.user.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(session.user),
        organization: session.organization,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
