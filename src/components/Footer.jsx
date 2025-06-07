'use client'

export default function Footer() {
  return (
    <footer className="py-4 px-6 border-t border-[#2a2a35] bg-[#0a0a0f]/80 backdrop-blur-md">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="text-sm text-gray-500 mb-2 sm:mb-0">
          <span>&copy; {new Date().getFullYear()} FaceFusion. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Version 1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
