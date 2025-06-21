'use client'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'
import {
  FaInfoCircle,
  FaQuestionCircle,
  FaEnvelope,
  FaShieldAlt,
  FaFileContract,
  FaUser,
} from 'react-icons/fa'

export default function MoreMenu() {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="text-gray-400 hover:text-white hover:bg-[#2a2d34] rounded-lg p-2 flex items-center gap-2">
        <FaInfoCircle size={16} />
        <span>More</span>
        <svg
          className="w-4 h-4 transition-transform ui-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </Menu.Button>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-[#1a1d24] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaUser size={14} />
                  Profile
                </Link>
              )}
            </Menu.Item>
            <div className="border-t border-gray-700 my-1"></div>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/about"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaInfoCircle size={14} />
                  About Us
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/faq"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaQuestionCircle size={14} />
                  FAQ
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/contact"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaEnvelope size={14} />
                  Contact Us
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/privacy"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaShieldAlt size={14} />
                  Privacy Policy
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/terms"
                  className={`${active ? 'bg-[#2a2d34]' : ''} flex px-4 py-2 text-sm text-gray-400 hover:text-white items-center gap-2`}
                >
                  <FaFileContract size={14} />
                  Terms & Conditions
                </Link>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
