import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];
const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(?:\.\d+)?$/;

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => AUTH_COOKIE_PATTERN.test(name));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname) || hasSupabaseAuthCookie(request)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";

  if (pathname !== "/") {
    url.searchParams.set(
      "redirect",
      `${pathname}${request.nextUrl.search}`,
    );
  }

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // API routes authenticate themselves. Static/PWA assets never need auth.
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)",
  ],
};
