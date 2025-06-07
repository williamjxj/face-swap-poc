'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'
import AuthButton from '@/components/AuthButton'
import EmailForm from './EmailForm'
import { HiMail } from 'react-icons/hi'
import './form-fix.css'

export default function SignInPage() {
  const router = useRouter()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true)
      const session = await getSession()
      if (session) {
        router.push('/welcome')
      }
      setIsLoading(false)
    }
    checkSession()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 8L20 12H12L16 8Z" fill="white" />
              <path d="M12 12H20V20H12V12Z" fill="white" />
              <path d="M16 24L12 20H20L16 24Z" fill="white" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold krea-gradient-text mb-1">FaceFusion</h1>
          <p className="text-gray-400 text-center max-w-xs">
            Sign in to continue to your AI face swap experience
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#13131a] rounded-2xl border border-[#2a2a35] p-8 shadow-xl">
          {!showEmailForm ? (
            <div className="space-y-6">
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-[#2a2a35] bg-[#1a1a23] text-white hover:bg-[#22222c] transition-colors"
              >
                <HiMail size={20} />
                <span className="font-medium">Continue with Email</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a35]"></div>
                </div>
                <div className="relative bg-[#13131a] px-4">
                  <span className="text-sm text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <AuthButton provider="google" />
                <AuthButton provider="azure-ad" />
              </div>
            </div>
          ) : (
            <>
              <EmailForm />
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  ← Back to all sign in options
                </button>
              </div>
            </>
          )}
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-400 hover:text-blue-300">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
