import { signIn, signOut, getSession } from 'next-auth/react'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'

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
  ],
  session: {
    strategy: 'jwt',
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
      return baseUrl + '/welcome'
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      return session
    },
  },
}

export const loginWithGoogle = async () => {
  try {
    await signIn('google')
    return { success: true }
  } catch (error) {
    console.error('Google login error:', error)
    return { success: false, error: error.message }
  }
}

export const loginWithMicrosoft = async () => {
  try {
    await signIn('azure-ad')
    return { success: true }
  } catch (error) {
    console.error('Microsoft login error:', error)
    return { success: false, error: error.message }
  }
}

export const getCurrentSession = async () => {
  try {
    const session = await getSession()
    return session
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

export const logout = async () => {
  try {
    // Clear client-side storage
    window.localStorage.removeItem('nextauth.message')
    window.sessionStorage.clear()
    
    // Clear cookies via API
    await fetch('/api/logout', { method: 'POST' })
    
    // Sign out via NextAuth
    await signOut({ callbackUrl: '/' })
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

export const isAuthenticated = async () => {
  const session = await getCurrentSession()
  return !!session?.user
}
