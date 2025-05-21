'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './emailform.module.css'

export default function SimpleEmailForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const emailInputRef = useRef(null)
  
  // Focus the email input on mount
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', { email, password })
    alert(`Form submitted with email: ${email} and password: ${password}`)
  }
  
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Test Form</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="test-email" className={styles.label}>Email Address</label>
          <input 
            id="test-email"
            type="email" 
            placeholder="your@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
            ref={emailInputRef}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="test-password" className={styles.label}>Password</label>
          <input 
            id="test-password"
            type="password" 
            placeholder="Your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
          />
        </div>
        
        <button 
          type="submit" 
          className={styles.button}
        >
          Submit Test
        </button>
      </form>
    </div>
  )
}
