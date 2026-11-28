import { describe, expect, it } from "vitest";
import { buildSessionPayload, signSession, verifySessionToken } from "@/lib/session";

describe("session tokens", () => {
  it("round-trips a signed payload", () => {
    const payload = buildSessionPayload({
      userId: "usr-1",
      organizationId: "org-1",
      role: "OWNER",
    });

    expect(verifySessionToken(signSession(payload))).toMatchObject({
      userId: "usr-1",
      organizationId: "org-1",
      role: "OWNER",
    });
  });

  it("rejects a tampered signature", () => {
    const token = signSession(
      buildSessionPayload({ userId: "usr-1", organizationId: "org-1", role: "OWNER" })
    );
    const [body] = token.split(".");

    expect(verifySessionToken(`${body}.clefincorrecte`)).toBeNull();
  });

  it("rejects an expired payload", () => {
    const token = signSession({
      userId: "usr-1",
      organizationId: "org-1",
      role: "OWNER",
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects an empty or malformed token", () => {
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken("abc")).toBeNull();
  });
});
