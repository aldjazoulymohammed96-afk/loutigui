import crypto from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { UserRole } from "@/types";

export const SESSION_COOKIE = "loutigui_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  exp: number;
  /** Compared with the user's sessionVersion so password changes revoke cookies. */
  tokenVersion?: number;
}

let cachedSecret: string | null = null;

/**
 * Session signing secret. In production it MUST come from the environment.
 * In development we persist a random secret under data/ so that restarting
 * the dev server does not log everyone out.
 */
function getSecret(): string {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET n'est pas configuré. Définissez une clé aléatoire d'au moins 32 caractères en production."
    );
  }

  const file = path.join(process.cwd(), "data", ".session-secret");
  try {
    if (fs.existsSync(file)) {
      const saved = fs.readFileSync(file, "utf-8").trim();
      if (saved.length >= 32) {
        cachedSecret = saved;
        return cachedSecret;
      }
    }
  } catch {
    // Fall through to generation.
  }

  const generated = crypto.randomBytes(48).toString("hex");
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, generated, { encoding: "utf-8", mode: 0o600 });
  } catch {
    // If the file cannot be written, the in-memory secret still works for
    // this process lifetime.
  }
  cachedSecret = generated;
  return cachedSecret;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload?.userId || !payload?.organizationId) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSessionPayload(input: {
  userId: string;
  organizationId: string;
  role: UserRole;
  tokenVersion?: number;
}): SessionPayload {
  return {
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role,
    tokenVersion: input.tokenVersion ?? 0,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}
