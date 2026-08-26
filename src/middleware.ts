import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/api/auth'];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isLoggedIn && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
