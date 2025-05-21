'use client'
import { useRef, useState } from 'react'
import styles from './emailform.module.css'
import { loginWithEmail, registerUser } from '@/services/auth'

export default function UncontrolledForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Use refs for form inputs instead of state
  const emailRef = useRef()
  const passwordRef = useRef()
  const nameRef = useRef()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const email = emailRef.current?.value || ''
    const password = passwordRef.current?.value || ''
    const name = nameRef.current?.value || ''
    
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
  
  const handleFormToggle = () => {
    setIsLogin(!isLogin)
    setError('')
    
    // Give a moment for the DOM to update before trying to focus
    setTimeout(() => {
      if (emailRef.current) {
        emailRef.current.value = ''
        emailRef.current.focus()
      }
      if (passwordRef.current) {
        passwordRef.current.value = ''
      }
      if (nameRef.current) {
        nameRef.current.value = ''
      }
    }, 0)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle} id="formTitle">{isLogin ? 'Login' : 'Register'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form} aria-labelledby="formTitle" id="uncontrolledForm">
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="uncontrolled-name" className={styles.label}>Full Name (optional)</label>
            <input 
              id="uncontrolled-name"
              type="text" 
              placeholder="Your full name" 
              className={styles.input}
              aria-label="Full Name"
              autoComplete="name"
              ref={nameRef}
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="uncontrolled-email" className={styles.label}>Email Address</label>
          <input 
            id="uncontrolled-email"
            type="email" 
            placeholder="your@email.com" 
            required
            className={styles.input}
            aria-required="true"
            autoComplete="email"
            ref={emailRef}
            onFocus={() => console.log('Email field focused')}
            onChange={(e) => console.log('Email changed:', e.target.value)}
            onInput={(e) => console.log('Email input event:', e.target.value)}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="uncontrolled-password" className={styles.label}>Password</label>
          <input 
            id="uncontrolled-password"
            type="password" 
            placeholder="Your password" 
            required
            className={styles.input}
            aria-required="true"
            autoComplete={isLogin ? "current-password" : "new-password"}
            ref={passwordRef}
            onFocus={() => console.log('Password field focused')}
            onChange={(e) => console.log('Password changed:', e.target.value.length + ' chars')}
            onInput={(e) => console.log('Password input event:', e.target.value.length + ' chars')}
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
          onClick={handleFormToggle} 
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
