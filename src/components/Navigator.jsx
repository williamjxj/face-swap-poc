'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/services/auth-client'
import MoreMenu from './MoreMenu'
import { FaMagic, FaImages, FaSignOutAlt, FaPlay } from 'react-icons/fa'
import { useSession } from 'next-auth/react'
import { useUserData } from '@/hooks/useUserData'

export default function Navigator() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { userData, loading } = useUserData()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const { success } = await logout()
    if (success) {
      router.push('/')
    }
    setIsLoggingOut(false)
  }

  const navItems = [
    { href: '/face-fusion', icon: <FaMagic size={16} />, label: 'FaceFusion' },
    { href: '/gallery', icon: <FaImages size={16} />, label: 'Gallery' },
    { href: '/video-carousel', icon: <FaPlay size={16} />, label: 'Carousel' },
  ]

  // Function to get avatar background color based on email
  const getAvatarColor = email => {
    if (!email) return '#2563eb' // Default blue

    // Hash the email to get consistent colors for the same user
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // Function to get initials from email
  const getInitials = email => {
    if (!email) return 'U'

    const parts = email.split('@')[0].split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <nav className="flex gap-4 items-center">
      {navItems.map(item =>
        pathname === item.href ? (
          <span
            key={item.href}
            className="bg-blue-500 text-white rounded-lg p-2 flex items-center gap-2 cursor-default"
          >
            {item.icon} {item.label}
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="text-gray-400 hover:bg-[#2a2d34] rounded-lg p-2 flex items-center gap-2"
          >
            {item.icon} {item.label}
          </Link>
        )
      )}

      <MoreMenu />
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-gray-400 hover:text-white hover:bg-[#2a2d34] disabled:opacity-50 cursor-pointer flex items-center gap-2 rounded-lg p-2"
      >
        {isLoggingOut ? (
          'Logging out...'
        ) : (
          <>
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </>
        )}
      </button>

      {/* Avatar moved to end of nav */}
      {session?.user?.email && (
        <div className="relative group ml-1">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer text-white font-medium text-sm"
            style={{ backgroundColor: getAvatarColor(session.user.email) }}
          >
            {getInitials(session.user.email)}
          </div>

          {/* Enhanced Tooltip that appears on hover */}
          <div className="absolute right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 z-50">
            <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg px-4 py-4 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: getAvatarColor(session.user.email) }}
                >
                  {getInitials(session.user.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">User Account</p>
                  <p className="text-xs text-gray-400">Active Session</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-400">Email:</p>
                  <p className="truncate text-white font-mono">{session.user.email}</p>
                </div>

                {userData && (
                  <>
                    <div>
                      <p className="text-gray-400">User ID:</p>
                      <p className="truncate text-white font-mono">{userData.id}</p>
                    </div>

                    {userData.lastLogin && (
                      <div>
                        <p className="text-gray-400">Last Login:</p>
                        <p className="text-white">
                          {new Date(userData.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-2 border-t border-gray-600">
                  <p className="text-gray-400">Session Status:</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-green-400">Online</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-2 w-2 bg-gray-800 rotate-45 absolute -top-1 right-6 border-l border-t border-gray-700"></div>
          </div>
        </div>
      )}
    </nav>
  )
}
