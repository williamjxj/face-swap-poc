'use client'

export default function VideoItemSkeleton({ aspectRatio = 'auto', className = '' }) {
  return (
    <div
      className={`break-inside-avoid group relative card-elevated rounded-xl overflow-hidden ${className}`}
    >
      <div
        className="relative animate-shimmer surface-tertiary"
        style={aspectRatio !== 'auto' ? { aspectRatio } : { minHeight: '200px' }}
      >
        {/* Play button skeleton */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full surface-elevated animate-pulse opacity-70"></div>
        </div>

        {/* Duration badge skeleton */}
        <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1">
          <div className="w-8 h-3 surface-elevated rounded animate-pulse"></div>
        </div>

        {/* Action button skeleton */}
        <div className="absolute top-2 right-2 z-30">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl surface-elevated animate-pulse"></div>
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
