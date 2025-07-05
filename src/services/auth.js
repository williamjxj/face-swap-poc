// Server-side auth configuration - do not import client-side functions
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { findUserByEmail, updateUserLastLogin } from '@/lib/supabase-db'
import bcrypt from 'bcryptjs'

// Environment variables validated during build

export const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  // Removed Supabase adapter to use pure JWT strategy with our own user management
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
          const user = await findUserByEmail(credentials.email)

          // If user doesn't exist or password doesn't match
          if (!user || !user.password_hash) {
            return null
          }

          // Compare plain password with stored hash
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)

          if (!isValidPassword) {
            return null
          }

          // Update last login
          try {
            await updateUserLastLogin(user.email)
          } catch (error) {
            console.error('Login update error:', error)
          }

          // Return user object that will be saved in JWT
          const userResult = {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
          }
          return userResult
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
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
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
        if (account && user) {
          // For OAuth providers, get the user from our database
          if (account.provider === 'google' || account.provider === 'azure-ad') {
            const email = user.email || profile?.email || profile?.mail
            if (email) {
              const dbUser = await findUserByEmail(email)
              if (dbUser) {
                token.id = dbUser.id
                token.email = dbUser.email
                token.name = dbUser.name
              }
            }
          } else {
            // For credentials provider
            token.id = user.id
            token.email = user.email
            token.name = user.name
          }
        }

        // Always ensure we have the token data
        if (!token.id && token.email) {
          const dbUser = await findUserByEmail(token.email)
          if (dbUser) {
            token.id = dbUser.id
            token.email = dbUser.email
            token.name = dbUser.name
          }
        }

        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        // Handle case where token might be corrupted or empty
        if (!token || Object.keys(token).length === 0) {
          return null
        }

        // Pass user data from token to session
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name

        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // Return null to force re-authentication
        return null
      }
    },
    async signIn({ user, account, profile }) {
      try {
        // For credentials provider, user is already validated
        if (account?.provider === 'credentials') {
          return true
        }

        // For OAuth providers (Google, Azure), ensure user exists in our users table
        if (account?.provider === 'google' || account?.provider === 'azure-ad') {
          const email = user?.email || profile?.email || profile?.mail

          if (!email) {
            console.error('No email found in OAuth profile')
            return false
          }

          // Check if user exists in our users table
          let existingUser = await findUserByEmail(email)

          if (!existingUser) {
            // Create user in our users table
            const { createUser } = await import('@/lib/supabase-db')
            try {
              existingUser = await createUser({
                email: email,
                name: user?.name || profile?.name || email.split('@')[0],
              })
            } catch (createError) {
              console.error('Error creating OAuth user:', createError)
              return false
            }
          }

          return true
        }

        return false
      } catch (error) {
        console.error('SignIn callback error:', error)
        return false
      }
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

// Client-side functions moved to @/services/auth-client.js

// All client-side functions have been moved to @/services/auth-client.js
