import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') ||
    pathname.startsWith('/topics') || 
    pathname.startsWith('/interview') || 
    pathname.startsWith('/summary');

  if (token) {
    const decoded = decodeJwt(token);
    const isEmailVerified = decoded?.isEmailVerified;

    if (isProtectedRoute && isEmailVerified === false) {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('accessToken');
      return response;
    }

    if (isAuthPage && isEmailVerified !== false) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/topics/:path*',
    '/interview/:path*',
    '/summary/:path*',
    '/login',
    '/register'
  ],
};
