'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { logout } from '@/services/auth'
import { useRouter } from 'next/navigation'
import {
  Wand2,
  Images,
  User,
  LogOut,
  ChevronDown,
  Info,
  HelpCircle,
  Mail,
  Shield,
  FileText,
} from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const { success } = await logout()
    if (success) {
      router.push('/')
    }
    setIsLoggingOut(false)
  }

  // Function to get avatar background color based on email
  const getAvatarColor = email => {
    if (!email) return '#3b82f6' // Default blue

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

  const navItems = [
    { href: '/face-fusion', icon: <Wand2 size={18} />, label: 'FaceFusion' },
    { href: '/gallery', icon: <Images size={18} />, label: 'Gallery' },
    { href: '/profile', icon: <User size={18} />, label: 'Profile' },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-[#2a2a35]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/face-fusion" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wand2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold krea-gradient-text">FaceFusion</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-400 hover:bg-[#1a1a23] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 text-gray-400 hover:text-white hover:bg-[#1a1a23] rounded-lg px-3 py-2"
            >
              <Info size={18} />
              <span className="hidden sm:inline">More</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#13131a] border border-[#2a2a35] shadow-lg overflow-hidden z-50">
                <div className="py-1">
                  <Link
                    href="/about"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a23] hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Info size={16} />
                    About Us
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a23] hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <HelpCircle size={16} />
                    FAQ
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a23] hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Mail size={16} />
                    Contact Us
                  </Link>
                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a23] hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Shield size={16} />
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a23] hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FileText size={16} />
                    Terms & Conditions
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1 text-gray-400 hover:text-white hover:bg-[#1a1a23] rounded-lg px-3 py-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>

          {/* User avatar */}
          {session?.user?.email && (
            <div className="relative group">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center cursor-pointer text-white font-medium text-sm"
                style={{ background: getAvatarColor(session.user.email) }}
              >
                {getInitials(session.user.email)}
              </div>

              {/* Tooltip */}
              <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 z-50">
                <div className="bg-[#13131a] text-white text-sm rounded-lg shadow-lg border border-[#2a2a35] px-4 py-3">
                  <p className="font-medium">Logged in as:</p>
                  <p className="truncate mt-1 text-gray-300">{session.user.email}</p>
                </div>
                <div className="h-2 w-2 bg-[#13131a] rotate-45 absolute -top-1 right-3 border-t border-l border-[#2a2a35]"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
