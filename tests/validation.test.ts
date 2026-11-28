import { describe, expect, it } from "vitest";
import { loginSchema, onboardingSchema, registerSchema } from "@/lib/validation";

describe("validation", () => {
  it("accepts a valid login payload", () => {
    expect(loginSchema.safeParse({ identifier: "test@example.ci", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email and a short name on registration", () => {
    expect(
      registerSchema.safeParse({
        name: "A",
        phone: "+2250100000000",
        email: "pas-un-email",
        password: "Valide123",
      }).success
    ).toBe(false);
  });

  it("rejects an out-of-range payment due day during onboarding", () => {
    expect(
      onboardingSchema.safeParse({
        orgName: "Test",
        countryCode: "CI",
        defaultCurrency: "XOF",
        managementType: "OWNER",
        paymentDueDay: 31,
      }).success
    ).toBe(false);
  });

  it("applies onboarding defaults", () => {
    const parsed = onboardingSchema.safeParse({
      orgName: "Test",
      defaultCurrency: "XOF",
      managementType: "OWNER",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.countryCode).toBe("CI");
  });
});
