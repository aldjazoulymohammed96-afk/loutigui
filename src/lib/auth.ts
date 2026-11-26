import { NextResponse } from "next/server";
import { Organization, User, UserRole } from "@/types";
import { dataStore } from "@/lib/data-store";
import { readSessionToken, verifySessionToken } from "@/lib/session";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export interface AuthContext {
  user: User;
  organization: Organization;
}

/** Resolve the signed session cookie into a user + organisation pair. */
export async function getAuth(): Promise<AuthContext | null> {
  const token = await readSessionToken();
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await dataStore.getUserById(payload.userId);
  if (!user) return null;

  const organization = await dataStore.getOrganizationById(user.organizationId);
  if (!organization) return null;

  return { user, organization };
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) {
    throw new ApiError(401, "Session expirée ou non authentifiée. Reconnectez-vous.");
  }
  return auth;
}

export async function requireRole(roles: UserRole[]): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!roles.includes(auth.user.role)) {
    throw new ApiError(403, "Votre rôle ne permet pas cette action.");
  }
  return auth;
}

export function canManageOrganization(role: UserRole): boolean {
  return role === "OWNER" || role === "AGENCY_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageMoney(role: UserRole): boolean {
  return canManageOrganization(role) || role === "MANAGER" || role === "ACCOUNTANT";
}

/** Strip every credential field before sending a user to the client. */
export function sanitizeUser(user: User): Omit<User, "password" | "passwordHash"> {
  // Explicit allowlist: no credential field can accidentally reach a response.
  return {
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export function assertSameOrganization(entityOrganizationId: string | undefined, organizationId: string): void {
  if (!entityOrganizationId || entityOrganizationId !== organizationId) {
    throw new ApiError(404, "Ressource introuvable.");
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  // Domain errors from the store carry meaningful messages. Map them to the
  // right HTTP status instead of turning a missing cross-tenant resource into
  // a 500 (which would also leak that the resource exists).
  if (error instanceof Error) {
    const message = error.message;
    let status = 0;
    if (/introuvable|invalide ou expiré/i.test(message)) status = 404;
    else if (
      /déjà utilisé|existe déjà|déjà occupé|bail actif|supprimez d'abord|dernier administrateur|entièrement réglée/i.test(
        message
      )
    ) status = 409;
    else if (/obligatoire|au moins|incorrect|doit être supérieur/i.test(message)) status = 400;
    if (status) {
      return NextResponse.json({ success: false, error: message }, { status });
    }
  }
  // Never leak internal stack traces or driver errors to the client.
  console.error("[API]", error);
  return NextResponse.json(
    { success: false, error: "Une erreur interne est survenue." },
    { status: 500 }
  );
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") || undefined;
}
