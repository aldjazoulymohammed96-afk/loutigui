import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "loutigui_session";

/**
 * Pages that can be opened without a session. Everything else requires the
 * presence of the signed session cookie; the cryptographic verification and
 * the per-organisation authorisation happen in each API route.
 */
const PUBLIC_PAGES = [
  "/landing",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  // "/" renders the public landing page when there is no session.
  if (pathname === "/") {
    return NextResponse.next();
  }

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
