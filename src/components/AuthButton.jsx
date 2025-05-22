'use client'
import dynamic from 'next/dynamic'
const FcGoogle = dynamic(() => import('react-icons/fc').then(mod => mod.FcGoogle), { ssr: false })
const FaMicrosoft = dynamic(() => import('react-icons/fa6').then(mod => mod.FaMicrosoft), {
  ssr: false,
})

import { signIn } from 'next-auth/react'

export default function AuthButton({ provider }) {
  const onClick = () => signIn(provider)
  const providers = {
    google: {
      name: 'Google',
      icon: <FcGoogle size={20} />,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      hoverBg: 'hover:bg-gray-50',
    },
    'azure-ad': {
      name: 'Microsoft',
      icon: <FaMicrosoft size={20} className="text-[#0078d4]" />,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      hoverBg: 'hover:bg-gray-50',
    },
  }

  const { name, icon, bgColor, textColor, borderColor, hoverBg } = providers[provider]

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-3 w-full py-3 px-4 rounded-md border ${bgColor} ${textColor} ${borderColor} ${hoverBg} transition-colors cursor-pointer hover:shadow-md active:scale-[0.98]`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium">Continue with {name}</span>
    </button>
  )
}
