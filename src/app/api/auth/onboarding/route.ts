import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { onboardingSchema } from "@/lib/validation";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { organization } = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Requête invalide." },
        { status: 400 }
      );
    }

    const org = await dataStore.completeOnboarding(organization.id, parsed.data);
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return errorResponse(error);
  }
}
