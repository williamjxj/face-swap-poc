// Auth helper utilities
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import { findUserById, findUserByEmail } from '@/lib/supabase-db'

/**
 * Gets a validated user ID from the session, ensuring the user exists in the database
 * @returns {Promise<string|null>} The user ID or null if not authenticated/valid
 */
export async function getValidatedUserId() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }

    // Verify the user exists in database
    const user = await findUserById(session.user.id)

    if (!user) {
      // If we have an email, try to find the user by email as fallback
      if (session.user.email) {
        const userByEmail = await findUserByEmail(session.user.email)

        if (userByEmail) {
          return userByEmail.id
        }
      }

      return null
    }

    return user.id
  } catch (error) {
    console.error('[AUTH ERROR] Failed to validate user ID:', error)
    return null
  }
}

/**
 * Logs debug information about a session for troubleshooting
 * Only enabled in development mode
 */
export async function logSessionDebugInfo() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const session = await getServerSession(authOptions)
      console.log('[SESSION DEBUG] Current session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      })
    } catch (error) {
      console.error('[SESSION DEBUG] Error getting session:', error)
    }
  }
}
