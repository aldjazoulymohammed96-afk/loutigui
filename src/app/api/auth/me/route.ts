import { NextResponse } from "next/server";
import { errorResponse, requireAuth, sanitizeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { user, organization } = await requireAuth();
    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        organization,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
