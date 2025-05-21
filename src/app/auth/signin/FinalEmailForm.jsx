'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './emailform.module.css'
import { loginWithEmail, registerUser } from '@/services/auth'
import { useRouter } from 'next/navigation'
import './input-fix.css'

export default function FinalEmailForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Using refs for form fields (uncontrolled components)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const nameRef = useRef(null)
  
  // Focus the email input when component mounts or when switching between login/register
  useEffect(() => {
    if (emailRef.current) {
      // Focus with a small delay to ensure DOM is ready
      setTimeout(() => {
        // Ensure input is not read-only or disabled
        if (emailRef.current) {
          emailRef.current.readOnly = false
          emailRef.current.disabled = false
          
          // Force focus
          emailRef.current.focus()
          
          // Click to ensure mobile devices show keyboard
          emailRef.current.click()
          
          // Debug logging
          console.log('Email input focused:', document.activeElement === emailRef.current)
          
          // Add direct DOM event listeners for debugging
          emailRef.current.addEventListener('input', (e) => {
            console.log('DOM input event on email:', e.target.value)
          })
        }
      }, 100) // Small timeout to ensure DOM is ready
    }
  }, [isLogin])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Get values directly from the DOM inputs
    const email = emailRef.current?.value || ''
    const password = passwordRef.current?.value || ''
    const name = nameRef.current?.value || ''
    
    console.log('Form submitted with:', { 
      email, 
      password: password ? '(provided)' : '(empty)', 
      name: name ? '(provided)' : '(empty)' 
    })
    
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
        console.log('Login result:', result)
        if (!result.success) {
          setError(result.error || 'Invalid email or password')
        } else {
          // Redirect on successful login
          router.push('/welcome')
        }
      } else {
        // Register
        const result = await registerUser(email, password, name)
        console.log('Registration result:', result)
        if (!result.success) {
          setError(result.error || 'Registration failed')
        } else {
          // Redirect on successful registration
          router.push('/welcome')
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    
    // Reset form fields on mode toggle
    if (emailRef.current) emailRef.current.value = ''
    if (passwordRef.current) passwordRef.current.value = ''
    if (nameRef.current && nameRef.current.value) nameRef.current.value = ''
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
            <label htmlFor="final-name" className={styles.label}>
              Full Name (optional)
            </label>
            <input 
              id="final-name"
              name="name"
              type="text" 
              placeholder="Your full name" 
              className={styles.input}
              ref={nameRef}
              autoComplete="name"
              tabIndex={1}
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="final-email" className={styles.label}>
            Email Address
          </label>
          <input 
            id="final-email"
            name="email"
            type="email" 
            placeholder="your@email.com" 
            className={styles.input}
            ref={emailRef}
            required
            autoComplete="email"
            tabIndex={2}
            onFocus={() => console.log('Email focus event triggered')}
            onChange={(e) => console.log('Email change:', e.target.value)}
            onInput={(e) => console.log('Email input:', e.target.value)}
            onClick={(e) => e.target.focus()} // Ensure click activates the input
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="final-password" className={styles.label}>
            Password
          </label>
          <input 
            id="final-password"
            name="password"
            type="password" 
            placeholder="Your password" 
            className={styles.input}
            ref={passwordRef}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            tabIndex={3}
            onClick={(e) => e.target.focus()} // Ensure click activates the input
          />
        </div>
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
          tabIndex={4}
        >
          {loading ? (
            <span className={styles.spinnerContainer}>
              <span className={styles.spinner}></span>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            isLogin ? 'Sign in' : 'Create account'
          )}
        </button>
      </form>
      
      <div className={styles.switchMode}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={handleToggleMode} 
          className={styles.switchButton}
          tabIndex={5}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
      
      {isLogin && (
        <div className={styles.forgotPassword}>
          <button className={styles.forgotLink} tabIndex={6}>
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  )
}
