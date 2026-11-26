import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { errorResponse } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public receipt verification. A receipt hash is unguessable and acts as the
 * access key; only non-sensitive fields are returned.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const limit = rateLimit(rateLimitKey(request, "verify"), 60, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "Trop de requêtes." }, { status: 429 });
    }

    const { hash } = await params;
    const receipt = await dataStore.getReceiptByHash(hash);
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: "Document non certifié ou introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptNumber: receipt.receiptNumber,
        verificationHash: receipt.verificationHash,
        issuedAt: receipt.issuedAt,
        tenantName: receipt.tenantName,
        unitNumber: receipt.unitNumber,
        buildingName: receipt.buildingName,
        periodLabel: receipt.periodLabel,
        amountPaid: receipt.amountPaid,
        paymentMethod: receipt.paymentMethod,
        provider: receipt.provider,
        transactionRef: receipt.transactionRef,
        organizationName: receipt.organizationName,
        status: "AUTHENTIC_CERTIFIED",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
