'use client'
import { useState } from 'react'
import { loginWithEmail, registerUser } from '@/services/auth'
import { useRouter } from 'next/navigation'
import './form-fix.css'

export default function EmailForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please provide both email and password')
      return
    }

    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const result = await loginWithEmail(email, password)
        if (!result.success) {
          setError(result.error || 'Invalid email or password')
        } else {
          // Redirect on successful login
          router.push('/welcome')
        }
      } else {
        // Register
        const result = await registerUser(email, password, name)
        if (!result.success) {
          setError(result.error || 'Registration failed')
        } else {
          // Redirect on successful registration
          router.push('/welcome')
        }
      }
    } catch (error) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6 text-center">
        {isLogin ? 'Sign in to your account' : 'Create a new account'}
      </h2>

      {error && (
        <div
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="user-name" className="block mb-1.5 text-sm text-gray-300">
              Full Name (optional)
            </label>
            <input
              id="user-name"
              name="name"
              type="text"
              placeholder="Your full name"
              className="w-full px-4 py-3 bg-[#1a1a23] border border-[#2a2a35] rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              tabIndex={1}
            />
          </div>
        )}

        <div>
          <label htmlFor="user-email" className="block mb-1.5 text-sm text-gray-300">
            Email Address
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-[#1a1a23] border border-[#2a2a35] rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            tabIndex={2}
          />
        </div>

        <div>
          <label htmlFor="user-password" className="block mb-1.5 text-sm text-gray-300">
            Password
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            placeholder="Your password"
            className="w-full px-4 py-3 bg-[#1a1a23] border border-[#2a2a35] rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            tabIndex={3}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
          tabIndex={4}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : isLogin ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-400">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button
          onClick={handleToggleMode}
          className="ml-1 text-blue-400 hover:text-blue-300"
          tabIndex={5}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>

      {isLogin && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm" tabIndex={6} type="button">
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  )
}
