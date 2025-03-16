import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const token = process.env.COOKIE_NAME!;

export async function middleware(req: NextRequest) {
  // Get token from cookies
  const cookieToken = req.cookies.get(token);
  
  // Only log in development mode
  if (process.env.NODE_ENV === "development") {
    console.log('[MIDDLEWARE] Cookie token:', cookieToken?.value);
    console.log('[MIDDLEWARE] All cookies:', req.cookies.getAll());
    console.log('[MIDDLEWARE] URL:', req.url);
  }
  
  const isAuth = cookieToken?.value ? true : false;

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/signin") ||
    req.nextUrl.pathname.startsWith("/signup") ||
    req.nextUrl.pathname.startsWith("/verify");

  // Allow OPTIONS requests for CORS
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return null;
  }

  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/signin?from=${encodeURIComponent(from)}`, req.url)
    );
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup", "/verify"],
};
