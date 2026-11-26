import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organization } = await requireAuth();
    const { id } = await params;
    const receipt = await dataStore.getReceiptById(organization.id, id);
    if (!receipt) {
      return NextResponse.json({ success: false, error: "Quittance introuvable." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (error) {
    return errorResponse(error);
  }
}
