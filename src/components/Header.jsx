'use client'
import Navigator from './Navigator'

export default function Header() {
  return (
    <header className="flex justify-between items-center pb-4 ml-8 mr-8 mt-4 border-b border-primary/20">
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="FaceFusion logo"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                <stop offset="100%" stopColor="rgb(147, 51, 234)" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
            <path d="M16 8L20 12H12L16 8Z" fill="white" />
            <path d="M12 12H20V20H12V12Z" fill="white" />
            <path d="M16 24L12 20H20L16 24Z" fill="white" />
          </svg>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-lg -z-10"></div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
            FaceFusion
          </h1>
          <p className="text-xs text-tertiary font-medium">AI-Powered Face Swapping</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Navigator />
      </div>
    </header>
  )
}
