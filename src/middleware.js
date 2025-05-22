import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define allowed origins
const allowedOrigins = ['shop.ultimatech.hk', 'localhost:3000']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Skip middleware for static files and API routes
  if (
    pathname.includes('/_next/') ||
    pathname.includes('/static/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const response = new NextResponse(null, { status: 204 })
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Set CORS headers for allowed origins
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost'))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }

  // For API routes, add CORS headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()

    // Set CORS headers for allowed origins
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost'))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
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
