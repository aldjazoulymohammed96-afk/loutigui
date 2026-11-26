import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const PREFIX = "scrypt";

/**
 * Hash a password with scrypt (Node built-in, no native dependency).
 * Format: scrypt$<salt-hex>$<hash-hex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return `${PREFIX}$${salt}$${derived.toString("hex")}`;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify a password against a stored hash. Legacy plaintext values are
 * supported so existing accounts can be migrated on first successful login.
 */
export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored) return false;

  if (!stored.startsWith(`${PREFIX}$`)) {
    // Legacy plaintext password.
    return safeEqual(password, stored);
  }

  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;

  const derived = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function isLegacyPasswordHash(stored?: string | null): boolean {
  return !!stored && !stored.startsWith(`${PREFIX}$`);
}

/** Basic password policy shared by registration and password changes. */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null;
}
