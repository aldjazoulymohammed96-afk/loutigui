import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { organization } = await requireAuth();
    return NextResponse.json({ success: true, data: await dataStore.getReceipts(organization.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
