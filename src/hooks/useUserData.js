'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export const useUserData = () => {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add a flag to track if we're in a specific component that needs full user data
  const [needsFullUserData, setNeedsFullUserData] = useState(false)

  // Function to explicitly request full user data from API when needed
  const fetchFullUserData = useCallback(async () => {
    if (!session?.user?.email) return

    setNeedsFullUserData(true)
    try {
      const response = await fetch(
        `/api/user/profile?email=${encodeURIComponent(session.user.email)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUserData(data)
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err.message || 'Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    // If we don't need full user data, just use the session data
    if (status === 'authenticated' && session?.user) {
      if (!needsFullUserData) {
        setUserData(session.user)
        setLoading(false)
      } else {
        // Only fetch full user data if explicitly requested
        fetchFullUserData()
      }
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setUserData(null)
    }
  }, [session, status, needsFullUserData, fetchFullUserData])

  return {
    userData,
    loading,
    error,
    isAuthenticated: !!userData,
    fetchFullUserData, // Add this function to allow components to explicitly request full user data
  }
}
