'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Check if we're on an auth page
  const isAuthPage = pathname?.includes('/auth/')
  
  if (isAuthPage || !session) {
    return null
  }
  
  return <Header />
}
