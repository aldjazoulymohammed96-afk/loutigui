import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { Currency } from "@/types";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireAuth();
    const currency = (request.nextUrl.searchParams.get("currency") as Currency) || "XOF";

    // Keep billing data current even if the cron has not run yet.
    const now = new Date();
    dataStore.generateMonthlyInstallments(organization.id, now.getFullYear(), now.getMonth() + 1);
    dataStore.refreshInstallmentStatuses(organization.id);

    const stats = dataStore.getDashboardStats(organization.id, currency);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return errorResponse(error);
  }
}
