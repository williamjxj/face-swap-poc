'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verify session exists
    const checkSession = async () => {
      const session = await getSession()
      if (!session) {
        router.push('/auth/signin')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        Welcome to Face Swap Generator
      </h1>
      <p className="mt-4 text-lg leading-6 text-gray-600">
        You have successfully logged in. Click below to start generating images.
      </p>
      <div className="mt-10">
        <button
          onClick={() => router.push('/face-fusion')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
