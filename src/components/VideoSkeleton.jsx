'use client'

export default function VideoSkeleton({ aspectRatio = '16/9', className = '' }) {
  return (
    <div
      className={`break-inside-avoid group relative surface-secondary rounded-xl overflow-hidden shadow-lg ${className}`}
    >
      <div className="relative animate-shimmer" style={{ aspectRatio }}>
        {/* Main skeleton area */}
        <div className="w-full h-full surface-tertiary"></div>

        {/* Play button skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full surface-elevated animate-pulse"></div>
        </div>

        {/* Duration badge skeleton */}
        <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1">
          <div className="w-8 h-3 surface-elevated rounded animate-pulse"></div>
        </div>

        {/* Action button skeleton */}
        <div className="absolute top-2 right-2">
          <div className="w-10 h-10 rounded-xl surface-elevated animate-pulse"></div>
        </div>
      </div>

      {/* Hover overlay skeleton */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
        <div className="p-3 w-full">
          {/* Title skeleton */}
          <div className="w-3/4 h-4 surface-elevated rounded animate-pulse mb-2"></div>

          {/* Metadata skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-3 surface-elevated rounded animate-pulse"></div>
              <div className="w-12 h-3 surface-elevated rounded animate-pulse"></div>
            </div>
            <div className="w-6 h-6 rounded-lg surface-elevated animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
