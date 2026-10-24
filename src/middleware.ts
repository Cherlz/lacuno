import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// Pages anyone can see before signing in.
const PUBLIC_PAGES = new Set(["/", "/help", "/robots.txt", "/sitemap.xml", "/sw.js"]);

export async function middleware(request: NextRequest) {
  if (!auth0) return NextResponse.next();

  const authResponse = await auth0.middleware(request);
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/auth")) return authResponse;
  if (PUBLIC_PAGES.has(pathname)) return authResponse;

  const session = await auth0.getSession(request);
  if (session) return authResponse;

  // Only signed-in people can use Claude, so the API key can't be abused.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  const login = new URL("/auth/login", request.url);
  login.searchParams.set("returnTo", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest.webmanifest|.*\\.(?:png|svg|jpg|ico|webmanifest)$).*)"],
};
