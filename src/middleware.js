import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('/_next/') ||
    pathname.includes('/static/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get the NextAuth.js token with secure configuration for long-term persistence
  const token = await getToken({
    req: request,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  // If user is logged in and trying to access login page, redirect to welcome page
  if (token && pathname === '/auth/signin') {
    const url = new URL('/welcome', request.url)
    return NextResponse.redirect(url)
  }

  // For all other cases, continue to the requested page
  return NextResponse.next()
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
