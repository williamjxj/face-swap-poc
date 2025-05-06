'use client'

export default function Footer() {
    return (
        <footer className="bg-gray-200 fixed bottom-0 w-full h-16">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    <span>&copy; {new Date().getFullYear()} Face Swap App. All rights reserved.</span>
                    <span className="ml-2">Version 1.0.0</span>
                </div>
            </div>
        </footer>
    )
}
