import { NextResponse } from 'next/server';

// 1. Define strictly public assets and auth routes
const PUBLIC_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // 🟢 SYNCED COOKIE NAME
  const token = req.cookies.get('auth_token')?.value;

  // 2. Allow static files and public assets to bypass middleware
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    PUBLIC_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // 3. Handle the Login Page logic
  if (pathname === '/login') {
    // If already logged in, skip the login page and go to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 4. Protect all other routes (Pages + API)
  if (!token) {
    // If it's an API call, return a JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'UNAUTHORIZED_ACCESS' }, { status: 401 });
    }
    // If it's a page request, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// 5. Matcher configuration for better performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (handled internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};