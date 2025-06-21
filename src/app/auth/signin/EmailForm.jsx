'use client'
import { useState } from 'react'
import styles from './emailform.module.css'
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
          setError(result.error || 'Invalid email or password 1')
        } else {
          // Redirect on successful login
          router.push('/face-fusion')
        }
      } else {
        // Register
        const result = await registerUser(email, password, name)
        if (!result.success) {
          setError(result.error || 'Registration failed')
        } else {
          // Redirect on successful registration
          router.push('/gallery')
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
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        {isLogin ? 'Sign in to your account' : 'Create a new account'}
      </h2>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="user-name" className={styles.label}>
              Full Name (optional)
            </label>
            <input
              id="user-name"
              name="name"
              type="text"
              placeholder="Your full name"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              tabIndex={1}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="user-email" className={styles.label}>
            Email Address
          </label>
          <input
            id="user-email"
            name="email"
            type="email"
            placeholder="your@email.com"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            tabIndex={2}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="user-password" className={styles.label}>
            Password
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            placeholder="Your password"
            className={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            tabIndex={3}
          />
        </div>

        <button type="submit" className={styles.button} disabled={loading} tabIndex={4}>
          {loading ? (
            <span className={styles.spinnerContainer}>
              <span className={styles.spinner}></span>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : isLogin ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className={styles.switchMode}>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button onClick={handleToggleMode} className={styles.switchButton} tabIndex={5}>
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>

      {isLogin && (
        <div className={styles.forgotPassword}>
          <button className={styles.forgotLink} tabIndex={6} type="button">
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  )
}
