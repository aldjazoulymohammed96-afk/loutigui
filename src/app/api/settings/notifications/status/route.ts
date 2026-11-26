import { NextResponse } from "next/server";
import { getNotificationStatus } from "@/lib/notification-service";
import { getPaymentProviderStatus } from "@/lib/payment-provider";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Returns configuration state only — never credentials. */
export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({
      success: true,
      data: {
        ...getNotificationStatus(),
        payments: getPaymentProviderStatus(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
