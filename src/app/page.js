import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const session = await getServerSession(authOptions)

    if (session) {
      // When logged in, redirect to gallery page
      redirect('/face-fusion')
    } else {
      // When not logged in, redirect to signin/signup page
      redirect('/auth/signin')
    }
  } catch (error) {
    // Check if it's a JWT decryption error specifically
    if (
      error.message?.includes('decryption operation failed') ||
      error.name === 'JWEDecryptionFailed'
    ) {
      console.error('JWT decryption error, redirecting to signin:', error.message)
      redirect('/auth/signin')
    }
    // Re-throw other errors (like NEXT_REDIRECT which is normal)
    throw error
  }
}
