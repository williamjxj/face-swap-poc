'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './emailform.module.css'
import { loginWithEmail, registerUser } from '@/services/auth'

export default function DomForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const formRef = useRef(null)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)
  const nameInputRef = useRef(null)

  // Focus email input on first render and when switching forms
  useEffect(() => {
    setTimeout(() => {
      if (emailInputRef.current) {
        // Force focus and ensure the input is interactive
        emailInputRef.current.focus()
        
        // Debug event listeners to track input events
        const addDebugListeners = (element, name) => {
          element.addEventListener('focus', () => console.log(`${name} focused`))
          element.addEventListener('blur', () => console.log(`${name} blurred`))
          element.addEventListener('input', (e) => console.log(`${name} input event: ${e.target.value}`))
          element.addEventListener('click', () => console.log(`${name} clicked`))
        }
        
        // Add listeners to all input fields
        if (emailInputRef.current) addDebugListeners(emailInputRef.current, 'Email')
        if (passwordInputRef.current) addDebugListeners(passwordInputRef.current, 'Password')
        if (nameInputRef.current) addDebugListeners(nameInputRef.current, 'Name')
        
        // Ensure input is not read-only or disabled
        if (emailInputRef.current) {
          emailInputRef.current.readOnly = false
          emailInputRef.current.disabled = false
        }
        
        // Enable typing in the field
        if (document && document.activeElement !== emailInputRef.current) {
          emailInputRef.current.click()
        }
      }
    }, 100)
  }, [isLogin])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Get values from DOM directly
    const email = emailInputRef.current?.value || ''
    const password = passwordInputRef.current?.value || ''
    const name = nameInputRef.current?.value || ''
    
    console.log('DOM form submitted with:', { email, password, name: name ? '(provided)' : '(empty)' })
    
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
  
  const toggleForm = () => {
    setIsLogin(!isLogin)
    setError('')
    
    // Clear form fields when toggling
    if (formRef.current) {
      formRef.current.reset()
    }
    
    // Focus email input after toggle
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus()
      }
    }, 10)
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle} id="formTitle">{isLogin ? 'Login' : 'Register'}</h2>
      
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form} aria-labelledby="formTitle" id="domForm">
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="dom-name" className={styles.label}>Full Name (optional)</label>
            <input 
              id="dom-name"
              type="text" 
              placeholder="Your full name" 
              className={styles.input}
              aria-label="Full Name"
              autoComplete="name"
              ref={nameInputRef}
              onClick={e => e.target.focus()}
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="dom-email" className={styles.label}>Email Address</label>
          <input 
            id="dom-email"
            type="email" 
            placeholder="your@email.com" 
            required
            className={styles.input}
            aria-required="true"
            autoComplete="email"
            ref={emailInputRef}
            onClick={e => e.target.focus()}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="dom-password" className={styles.label}>Password</label>
          <input 
            id="dom-password"
            type="password" 
            placeholder="Your password" 
            required
            className={styles.input}
            aria-required="true"
            autoComplete={isLogin ? "current-password" : "new-password"}
            ref={passwordInputRef}
            onClick={e => e.target.focus()}
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
          onClick={toggleForm} 
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
