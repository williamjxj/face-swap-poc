'use client'
import { signIn, signOut, getSession } from 'next-auth/react'

// Client-side authentication functions
export const getCurrentSession = async () => {
  try {
    return await getSession()
  } catch (error) {
    console.error('Error getting session:', error)
    return null
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
        error: result.error,
      }
    }

    return {
      success: true,
      user: result?.user,
    }
  } catch (error) {
    console.error('Login error:', error)
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
      return {
        success: false,
        error: data.error || 'Registration failed',
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error.message || 'Registration failed',
    }
  }
}

export const logoutUser = async () => {
  try {
    await signOut({ redirect: false })
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: error.message || 'Logout failed',
    }
  }
}

// Alias for compatibility
export const logout = logoutUser

// Google OAuth login
export const loginWithGoogle = async () => {
  try {
    const result = await signIn('google', { redirect: false })
    return {
      success: !result?.error,
      error: result?.error,
    }
  } catch (error) {
    console.error('Google login error:', error)
    return {
      success: false,
      error: error.message || 'Google login failed',
    }
  }
}

// Azure AD OAuth login
export const loginWithAzure = async () => {
  try {
    const result = await signIn('azure-ad', { redirect: false })
    return {
      success: !result?.error,
      error: result?.error,
    }
  } catch (error) {
    console.error('Azure login error:', error)
    return {
      success: false,
      error: error.message || 'Azure login failed',
    }
  }
}
