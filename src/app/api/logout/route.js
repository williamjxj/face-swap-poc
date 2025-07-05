import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

export async function POST() {
  try {
    // Get the current session to identify the user
    const session = await getServerSession(authOptions)

    // If we have a user session, update their logout timestamp
    // TODO: Implement updateUserLogout function in Supabase if needed
    if (session?.user?.email) {
      // await updateUserLogout(session.user.email)
    }

    const response = NextResponse.json({ success: true })

    // Clear all auth-related cookies
    response.cookies.delete('session')
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('next-auth.csrf-token')
    response.cookies.delete('next-auth.callback-url')

    // Add headers to prevent caching of auth state
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
