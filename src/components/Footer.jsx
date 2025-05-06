'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FaInfoCircle,
  FaQuestionCircle,
  FaEnvelope,
  FaShieldAlt,
  FaFileContract 
} from 'react-icons/fa'

export default function Footer() {
    const pathname = usePathname()

    const footerItems = [
        { href: '/about', icon: <FaInfoCircle size={14} />, label: 'About Us' },
        { href: '/faq', icon: <FaQuestionCircle size={14} />, label: 'FAQ' },
        { href: '/contact', icon: <FaEnvelope size={14} />, label: 'Contact Us' },
        { href: '/privacy', icon: <FaShieldAlt size={14} />, label: 'Privacy Policy' },
        { href: '/terms', icon: <FaFileContract size={14} />, label: 'Terms & Conditions' }
    ]

    return (
        <footer className="bg-gray-200 fixed bottom-0 w-full h-16">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex gap-6">
                    {footerItems.map((item) => (
                        pathname === item.href ? (
                            <span 
                                key={item.href}
                                className="text-sm text-blue-600 font-medium flex items-center gap-1 cursor-default"
                            >
                                {item.icon} {item.label}
                            </span>
                        ) : (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className="text-sm hover:text-blue-600 flex items-center gap-1"
                            >
                                {item.icon} {item.label}
                            </Link>
                        )
                    ))}
                </div>
                <div className="text-sm text-gray-600">
                    <span>&copy; {new Date().getFullYear()} AI Image Generator. All rights reserved.</span>
                    <span className="ml-2">Version 1.0.0</span>
                </div>
            </div>
        </footer>
    )
}
