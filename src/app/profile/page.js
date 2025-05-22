'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex-grow p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mt-8 p-10 text-center">
          <h2 className="text-xl font-medium mb-4">User Profile</h2>
          <p className="text-gray-600">Your profile information will appear here.</p>
        </div>
      </div>
    </div>
  )
}
