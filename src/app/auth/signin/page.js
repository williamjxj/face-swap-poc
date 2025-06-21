'use client'
import AuthButton from '@/components/AuthButton'
import EmailForm from './EmailForm'
import styles from './signin.module.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'
import './form-fix.css' // Import the form fix CSS

export default function SignInPage() {
  const router = useRouter()
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/face-fusion')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="8" fill="#3B82F6" />
              <path d="M16 8L20 12H12L16 8Z" fill="white" />
              <path d="M12 12H20V20H12V12Z" fill="white" />
              <path d="M16 24L12 20H20L16 24Z" fill="white" />
            </svg>
            <span className={styles.logoText}>FaceFusion</span>
          </div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to your account</p>
        </div>

        {!showEmailForm ? (
          <div className={styles.providers}>
            <AuthButton provider="google" />
            <div className={styles.divider}>or</div>
            <AuthButton provider="azure-ad" />
            <div className={styles.divider}>or</div>
            <button onClick={() => setShowEmailForm(true)} className={styles.emailButton}>
              Continue with Email
            </button>
          </div>
        ) : (
          <>
            <EmailForm />
            <div className={styles.backLinkContainer}>
              <button onClick={() => setShowEmailForm(false)} className={styles.backLink}>
                ← Back to all sign in options
              </button>
            </div>
          </>
        )}

        <div className={styles.footer}>
          <p className={styles.terms}>
            By continuing, you agree to our{' '}
            <a href="/terms" className={styles.link}>
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className={styles.link}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
