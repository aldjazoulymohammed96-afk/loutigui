import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { errorResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
