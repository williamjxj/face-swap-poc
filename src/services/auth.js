import { signIn, signOut, getSession } from 'next-auth/react'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await db.user.findUnique({
            where: { account: credentials.email },
          })

          // If user doesn't exist or password doesn't match
          if (!user || !user.passwordHash) {
            return null
          }

          // Compare plain password with stored hash
          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isValidPassword) {
            return null
          }

          // Return user object that will be saved in JWT
          return {
            id: user.id,
            email: user.account,
            name: user.name || user.account.split('@')[0],
          }
        } catch (error) {
          console.error('Credentials auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    // Keep session active for 30 days
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/face-fusion'
    },
    async jwt({ token, user, account, profile }) {
      try {
        // Initial sign in
        if (account && profile) {
          // Store user email in the token
          token.email = profile.email || profile.mail
        }
        if (user) {
          token.id = user.id
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return {}
      }
    },
    async session({ session, token }) {
      try {
        // Handle case where token might be corrupted or empty
        if (!token || Object.keys(token).length === 0) {
          console.log('Empty or corrupted token, returning null session')
          return null
        }

        // Pass user ID to the client session
        session.user.id = token.id

        // If we have an email, ensure the user exists in the database
        if (session?.user?.email) {
          try {
            // Use upsert but retrieve the user information to get the correct ID
            const user = await db.user.upsert({
              where: { account: session.user.email },
              update: { lastLogin: new Date() },
              create: {
                account: session.user.email,
                lastLogin: new Date(),
                name: session.user.name || session.user.email.split('@')[0],
              },
            })

            // Always ensure we have the correct user ID from the database
            session.user.id = user.id
            console.log('Auth session updated with user ID:', user.id)
          } catch (error) {
            console.error('Error updating user session:', error)
            // Continue session but log the error
          }
        }

        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // Return null to force re-authentication
        return null
      }
    },
    async signIn({ profile, user }) {
      // Allow credential authentication where user is returned from authorize callback
      if (user) {
        return true
      }
      // Allow OAuth authentication where profile contains email
      if (profile?.email || profile?.mail) {
        return true
      }
      return false
    },
  },
}

export const loginWithGoogle = async () => {
  try {
    await signIn('google')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const loginWithMicrosoft = async () => {
  try {
    await signIn('azure-ad')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getCurrentSession = async () => {
  try {
    const session = await getSession()
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

export const logout = async () => {
  try {
    // Get current session to know which user is logging out
    const session = await getSession()

    // If we have an email, update the logout time
    if (session?.user?.email) {
      try {
        await db.user.update({
          where: { account: session.user.email },
          data: { lastLogout: new Date() },
        })
      } catch (error) {
        console.error('Logout update error:', error)
        // Continue with logout even if the update fails
      }
    }

    // Clear client-side storage
    window.localStorage.removeItem('nextauth.message')
    window.sessionStorage.clear()

    // Sign out via NextAuth
    await signOut({ callbackUrl: '/' })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const isAuthenticated = async () => {
  const session = await getCurrentSession()
  return !!session?.user
}

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    if (result?.ok) {
      return { success: true }
    }

    return {
      success: false,
      error: 'Login failed',
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Login failed',
    }
  }
}

export const registerUser = async (email, password, name = '') => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    // Auto login after successful registration
    return loginWithEmail(email, password)
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed',
    }
  }
}
