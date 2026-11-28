import { describe, expect, it } from "vitest";
import {
  hashPassword,
  isLegacyPasswordHash,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/password";

describe("password", () => {
  it("hash and verify a password without ever storing it in clear", () => {
    const stored = hashPassword("Testpass1");

    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(stored).not.toContain("Testpass1");
    expect(verifyPassword("Testpass1", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("produces a different hash for the same password (salt)", () => {
    expect(hashPassword("Testpass1")).not.toBe(hashPassword("Testpass1"));
  });

  it("still recognises a legacy clear-text password so it can be migrated", () => {
    expect(isLegacyPasswordHash("ancien-mot-de-passe")).toBe(true);
    expect(verifyPassword("ancien-mot-de-passe", "ancien-mot-de-passe")).toBe(true);
  });

  it("enforces the password policy", () => {
    expect(validatePasswordStrength("court1")).not.toBeNull();
    expect(validatePasswordStrength("sanschiffres")).not.toBeNull();
    expect(validatePasswordStrength("Valide123")).toBeNull();
  });
});
