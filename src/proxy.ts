import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionCookieValue } from "@/lib/session-cookie";

const OLD_HOST = "guaicaramo-inducciones.vercel.app";

export const config = {
  matcher: [
    // Match every path except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host") ?? "";

  // Old domain → show the "moved" page for every route
  if (host === OLD_HOST) {
    const moved = new URL("/moved", req.url);
    return NextResponse.rewrite(moved);
  }

  // Auth guard for module routes
  if (req.nextUrl.pathname.startsWith("/modulos")) {
    const cookieValue = req.cookies.get(COOKIE_NAME)?.value;

    if (cookieValue && (await verifySessionCookieValue(cookieValue))) {
      return NextResponse.next();
    }

    // No session — redirect to home with a flag so the login modal opens
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "1");
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
