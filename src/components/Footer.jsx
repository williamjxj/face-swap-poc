'use client'

export default function Footer() {
  return (
    <footer className="bottom-0 w-full h-8">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>&copy; {new Date().getFullYear()} FaceFusion. All rights reserved.</span>
          <span className="ml-2">Version 1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
