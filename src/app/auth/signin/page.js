'use client'
import AuthButton from '../../../components/AuthButton'
import styles from './signin.module.css'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/welcome')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Image 
            src="/next.svg" 
            alt="Logo" 
            className={styles.logo}
            width={120}
            height={24}
            priority
          />
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to your account</p>
        </div>
        
        <div className={styles.providers}>
          <AuthButton provider="google" />
          <div className={styles.divider}>or</div>
          <AuthButton provider="azure-ad" />
        </div>

        <div className={styles.footer}>
          <p className={styles.terms}>
            By continuing, you agree to our <a href="/terms" className={styles.link}>Terms</a> and <a href="/privacy" className={styles.link}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
