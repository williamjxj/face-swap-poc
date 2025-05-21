'use client'
import { useState, useEffect } from 'react'
import styles from './emailform.module.css'
import { loginWithEmail, registerUser } from '@/services/auth'

export default function EmailForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Input handlers
  const handleEmailChange = (e) => {
    console.log('Email changing:', e.target.value)
    setEmail(e.target.value)
  }
  
  const handlePasswordChange = (e) => {
    console.log('Password changing')
    setPassword(e.target.value)
  }
  
  const handleNameChange = (e) => {
    console.log('Name changing:', e.target.value)
    setName(e.target.value)
  }
  
  // Log input changes for debugging
  useEffect(() => {
    console.log('Form state:', { email, password, name: name.substring(0, 2) + '...' })
  }, [email, password, name])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submitted with:', { email, password, name: name ? '(provided)' : '(empty)' })
    
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const result = await loginWithEmail(email, password)
        console.log('Login result:', result)
        if (!result.success) {
          setError(result.error || 'Invalid email or password')
        }
      } else {
        // Register
        const result = await registerUser(email, password, name)
        console.log('Registration result:', result)
        if (!result.success) {
          setError(result.error || 'Registration failed')
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle} id="formTitle">{isLogin ? 'Login' : 'Register'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form} aria-labelledby="formTitle" id="authForm">
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="register-fullname" className={styles.label}>Full Name (optional)</label>
            <input 
              id="register-fullname"
              type="text" 
              placeholder="Your full name" 
              value={name}
              onChange={handleNameChange}
              className={styles.input}
              aria-label="Full Name"
              autoComplete="name"
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="auth-email" className={styles.label}>Email Address</label>
          <input 
            id="auth-email"
            type="email" 
            placeholder="your@email.com" 
            value={email}
            onChange={handleEmailChange}
            required
            className={styles.input}
            aria-required="true"
            autoComplete="email"
            aria-describedby={error ? "email-error" : undefined}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="auth-password" className={styles.label}>Password</label>
          <input 
            id="auth-password"
            type="password" 
            placeholder="Your password" 
            value={password}
            onChange={handlePasswordChange}
            required
            className={styles.input}
            aria-required="true"
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>
        
        {error && <div className={styles.error} id="form-error" role="alert">{error}</div>}
        
        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.button} ${loading ? styles.loading : ''}`}
          aria-busy={loading}
        >
          {loading ? 
            <span className={styles.spinnerContainer}>
              <span className={styles.spinner}></span>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span> : 
            isLogin ? 'Sign in' : 'Create account'
          }
        </button>
      </form>
      
      <div className={styles.switchMode}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={() => {
            setIsLogin(!isLogin)
            setEmail('')
            setPassword('')
            setName('')
            setError('')
          }}
          className={styles.switchButton}
          type="button"
        >
          {isLogin ? 'Register' : 'Sign in'}
        </button>
      </div>
      
      {isLogin && (
        <div className={styles.forgotPassword}>
          <button 
            className={styles.forgotLink}
            onClick={() => alert("Password reset functionality coming soon!")}
            type="button"
            aria-label="Reset your password"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  )
}
