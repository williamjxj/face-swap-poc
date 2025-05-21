'use client'
import Navigator from './Navigator'

export default function Header() {
  return (
    <header className="flex justify-between items-center pb-2 ml-8 mr-8 mt-2">
      <div className="flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FaceFusion logo">
          <rect width="32" height="32" rx="8" fill="#3B82F6"/>
          <path d="M16 8L20 12H12L16 8Z" fill="white"/>
          <path d="M12 12H20V20H12V12Z" fill="white"/>
          <path d="M16 24L12 20H20L16 24Z" fill="white"/>
        </svg>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          FaceFusion
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Navigator />
      </div>
    </header>
  )
}
