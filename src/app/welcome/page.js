'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function WelcomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Redirect to login if no session exists
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
    <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        Welcome to Face Swap Generator
      </h1>
      
      {session?.user?.email && (
        <p className="mt-4 text-xl font-medium text-blue-600">
          Logged in as: {session.user.email}
        </p>
      )}
      
      <p className="mt-4 text-lg leading-6 text-gray-600">
        You have successfully logged in. Click below to start generating images.
      </p>
      
      <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <button
          onClick={() => router.push('/face-fusion')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Start Face Swapping
        </button>
        
        <button
          onClick={() => router.push('/gallery')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          View Gallery
        </button>
      </div>
    </div>
  )
}
