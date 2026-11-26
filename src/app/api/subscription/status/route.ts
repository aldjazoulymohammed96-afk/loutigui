import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    const subscription = dataStore.getSubscriptionInfo(organization.id);

    return NextResponse.json({
      success: true,
      subscription,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        subscriptionPlan: organization.subscriptionPlan,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
