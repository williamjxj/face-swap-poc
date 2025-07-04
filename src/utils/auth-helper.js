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
      console.log('[AUTH] No user ID in session')
      return null
    }

    // Verify the user exists in database
    const user = await findUserById(session.user.id)

    if (!user) {
      console.log('[AUTH] User ID from session not found in database:', session.user.id)

      // If we have an email, try to find the user by email as fallback
      if (session.user.email) {
        const userByEmail = await findUserByEmail(session.user.email)

        if (userByEmail) {
          console.log('[AUTH] Found user by email instead:', userByEmail.id)
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
 */
export async function logSessionDebugInfo() {
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
