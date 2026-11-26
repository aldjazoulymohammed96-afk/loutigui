import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { forgotPasswordSchema } from "@/lib/validation";
import { errorResponse, getClientIp } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getNotificationStatus, sendNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(rateLimitKey(request, "forgot-password"), 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de demandes. Réessayez dans une heure." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const user = await dataStore.findUserByIdentifier(parsed.data.identifier);

    // Always answer the same way to avoid account enumeration.
    const genericResponse = {
      success: true,
      message:
        "Si un compte correspond à cet identifiant et qu'une adresse email y est associée, un lien de réinitialisation vient d'être envoyé.",
    };

    if (!user || !user.email) {
      return NextResponse.json(genericResponse);
    }

    const { token } = await dataStore.createPasswordReset(user.id);
    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

    await dataStore.audit({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user.id,
      ip: getClientIp(request),
    });

    if (getNotificationStatus().email.configured) {
      await sendNotification({
        channel: "EMAIL",
        to: user.email,
        toName: user.name,
        subject: "LOUTIGUI · Réinitialisation de votre mot de passe",
        text: `Bonjour ${user.name},\n\nUtilisez ce lien pour définir un nouveau mot de passe (valable 1 heure) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
        html: `<p>Bonjour ${user.name},</p><p>Utilisez ce lien pour définir un nouveau mot de passe (valable 1 heure) :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
      });
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    return errorResponse(error);
  }
}
