'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to fetch and provide the user's data from the database
 * @returns {Object} Object containing user data, loading state, and error
 */
export const useUserData = () => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // Get full user data from the database using the API
          const response = await fetch(`/api/user/profile?email=${encodeURIComponent(session.user.email)}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const data = await response.json();
          setUserData(data);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err.message || 'Failed to fetch user data');
          // Fallback to session data if API fails
          setUserData(session.user);
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setLoading(false);
        setUserData(null);
      }
    };

    fetchUserData();
  }, [session, status]);

  return { userData, loading, error, isAuthenticated: !!userData };
};
