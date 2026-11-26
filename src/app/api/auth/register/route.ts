import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { registerSchema } from "@/lib/validation";
import { buildSessionPayload, setSessionCookie } from "@/lib/session";
import { errorResponse, getClientIp, sanitizeUser } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(rateLimitKey(request, "register"), 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de créations de compte depuis cette adresse. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(parsed.data.password);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    const session = await dataStore.register({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      password: parsed.data.password,
      role: parsed.data.role,
    });

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
      action: "AUTH_REGISTER",
      entity: "Organization",
      entityId: session.organization.id,
      ip: getClientIp(request),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: sanitizeUser(session.user),
          organization: session.organization,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
