import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register');
  const isPublicShare = req.nextUrl.pathname.startsWith('/share/');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  // Allow public share pages
  if (isPublicShare) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect logged in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect non-logged in users to login
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files, _next, and api routes
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
