'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '../services/auth'
import MoreMenu from './MoreMenu'
import { FaMagic, FaImages, FaUser, FaSignOutAlt } from 'react-icons/fa'

export default function Navigator() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const { success } = await logout()
    if (success) {
      router.push('/')
    }
    setIsLoggingOut(false)
  }

  const navItems = [
    { href: '/face-swap', icon: <FaMagic size={16} />, label: 'Face Swap' },
    { href: '/gallery', icon: <FaImages size={16} />, label: 'Gallery' },
    { href: '/profile', icon: <FaUser size={16} />, label: 'Profile' }
  ]

  return (
    <nav className="flex gap-4">
      {navItems.map((item) => (
        pathname === item.href ? (
          <span 
            key={item.href}
            className="text-black bg-gray-100 rounded-md p-2 flex items-center gap-2 cursor-default"
          >
            {item.icon} {item.label}
          </span>
        ) : (
          <Link 
            key={item.href}
            href={item.href} 
            className="text-gray-600 hover:text-black hover:bg-gray-100 rounded-md p-2 flex items-center gap-2"
          >
            {item.icon} {item.label}
          </Link>
        )
      ))}
      <MoreMenu />
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-gray-600 hover:text-black disabled:opacity-50 cursor-pointer flex items-center gap-1"
      >
        {isLoggingOut ? 'Logging out...' : (
          <>
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </>
        )}
      </button>
    </nav>
  )
}
