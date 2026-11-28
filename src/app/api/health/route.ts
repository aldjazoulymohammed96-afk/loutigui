import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Liveness + database readiness probe for uptime monitors.
 * Never returns connection strings, tokens or version details.
 */
export async function GET() {
  const url = process.env.TURSO_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();

  if (!url) {
    return NextResponse.json(
      { status: "error", checks: { database: "not_configured" } },
      { status: 503 }
    );
  }

  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    try {
      await client.execute("SELECT 1 AS ok");
    } finally {
      client.close();
    }

    return NextResponse.json({
      status: "ok",
      checks: { database: "ok" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Le contrôle de santé de la base a échoué", error);
    return NextResponse.json(
      { status: "error", checks: { database: "unavailable" } },
      { status: 503 }
    );
  }
}
