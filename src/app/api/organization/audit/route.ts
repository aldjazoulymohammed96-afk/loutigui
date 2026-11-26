import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { canManageOrganization, errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageOrganization(user.role)) {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, data: await dataStore.getAuditLogs(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
