import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get email from query params or use session email
    const url = new URL(request.url)
    const email = url.searchParams.get('email') || session.user.email

    // Only allow fetching other users if the requesting user has permission
    // (For now, only allow users to fetch their own data)
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to access this user data' }, { status: 403 })
    }

    // Fetch user data from database
    const user = await db.user.findUnique({
      where: { account: email },
      select: {
        id: true,
        account: true,
        lastLogin: true,
        lastLogout: true,
        // Include any other fields you want to return
        // Don't include sensitive info
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}
