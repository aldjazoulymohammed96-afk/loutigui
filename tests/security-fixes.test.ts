import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidProviderId } from "@/lib/saspay";
import { claimPaymentReference } from "@/lib/processed-payments";
import { buildSessionPayload, signSession, verifySessionToken } from "@/lib/session";

afterEach(() => vi.unstubAllEnvs());

describe("provider identifiers", () => {
  it("accepts opaque tokens used by SasPay", () => {
    expect(isValidProviderId("cs_1234-abcd")).toBe(true);
    expect(isValidProviderId("pay_9F8aB7")).toBe(true);
  });

  it("rejects path traversal and injection attempts", () => {
    for (const value of ["../admin", "a/b", "a b", "", "x".repeat(129)]) {
      expect(isValidProviderId(value)).toBe(false);
    }
  });
});

describe("payment idempotency ledger", () => {
  it("lets only the first caller claim a reference, per scope", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("DATABASE_URL", "");

    const claim = {
      reference: "txn-123",
      scope: "subscription" as const,
      organizationId: "org-1",
    };
    expect(await claimPaymentReference(claim)).toBe(true);
    expect(await claimPaymentReference(claim)).toBe(false);
    expect(await claimPaymentReference({ ...claim, scope: "rent" as const })).toBe(true);
  });
});

describe("session token version", () => {
  it("round-trips the version used to revoke cookies after a password change", () => {
    const token = signSession(
      buildSessionPayload({
        userId: "usr-1",
        organizationId: "org-1",
        role: "OWNER",
        tokenVersion: 3,
      })
    );
    expect(verifySessionToken(token)?.tokenVersion).toBe(3);
  });
});
