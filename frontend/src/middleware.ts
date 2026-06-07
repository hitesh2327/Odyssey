import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const isAuthenticated = !!token;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/topics') || 
    pathname.startsWith('/interview') || 
    pathname.startsWith('/summary');

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/topics/:path*',
    '/interview/:path*',
    '/summary/:path*',
    '/login',
    '/register'
  ],
};
