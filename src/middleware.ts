// ============================================================
// Destiny AI Forge — Route Protection Middleware
// ============================================================
// Protects /dashboard routes by checking for a valid session cookie.
// Does NOT decrypt the cookie (expensive) — just checks existence.
// Full auth validation happens in the API routes themselves.
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

/** Routes that require authentication */
const PROTECTED_PATHS = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path requires authentication
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for the existence of the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session — redirect to home with a message
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('error', 'not_authenticated');
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — allow the request to proceed.
  // Actual token validation happens server-side in the page/API handler.
  return NextResponse.next();
}

export const config = {
  // Only run middleware on these paths (skip static files, API routes, etc.)
  matcher: ['/dashboard/:path*'],
};
