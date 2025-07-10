import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen surface-primary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-secondary mb-4">Page Not Found</h2>
        <p className="text-tertiary mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
