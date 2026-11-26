import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { sendReminder } from "@/lib/reminder-engine";
import { reminderCreateSchema } from "@/lib/validation";
import { errorResponse, getClientIp, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: dataStore.getReminders(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = reminderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    if (parsed.data.channel === "WHATSAPP") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le canal WhatsApp Business n'est pas connecté. Utilisez le SMS ou l'email, ou le lien WhatsApp depuis l'aperçu du message.",
        },
        { status: 501 }
      );
    }

    const result = await sendReminder({
      organizationId: organization.id,
      installmentId: parsed.data.installmentId,
      channel: parsed.data.channel,
      sequence: parsed.data.sequence,
      appUrl: process.env.APP_URL || new URL(request.url).origin,
    });

    dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "REMINDER_SENT",
      entity: "ReminderLog",
      entityId: result.log?.id,
      metadata: { channel: parsed.data.channel, success: result.success },
      ip: getClientIp(request),
    });

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        provider: result.provider,
        data: result.log,
      },
      { status: result.status }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
