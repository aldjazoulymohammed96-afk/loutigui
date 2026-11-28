import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { onboardingSchema } from "@/lib/validation";
import { canManageOrganization, errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    // `startEmpty` deletes every tenant record. Only the first onboarding by an
    // organisation administrator may do that.
    if (
      body?.startEmpty === true &&
      (organization.onboardingCompleted !== false || !canManageOrganization(user.role))
    ) {
      return NextResponse.json(
        { success: false, error: "Cette action est réservée au premier paramétrage par un administrateur." },
        { status: 403 }
      );
    }
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const org = await dataStore.completeOnboarding(organization.id, parsed.data);
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return errorResponse(error);
  }
}
