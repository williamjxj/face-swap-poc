'use client'

export default function MediaSkeleton({
  count = 8,
  viewMode = 'masonry',
  aspectRatio = 'auto',
  className = '',
}) {
  // Generate random aspect ratios for more realistic masonry layout
  const getRandomAspectRatio = () => {
    const ratios = ['4/3', '16/9', '3/4', '1/1', '9/16', '5/4']
    return ratios[Math.floor(Math.random() * ratios.length)]
  }

  // Generate random heights for masonry layout
  const getRandomHeight = () => {
    const heights = ['200px', '250px', '300px', '180px', '220px', '280px', '320px']
    return heights[Math.floor(Math.random() * heights.length)]
  }

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`break-inside-avoid group relative card-elevated rounded-xl overflow-hidden ${className}`}
      style={
        viewMode === 'masonry'
          ? { height: getRandomHeight() }
          : aspectRatio !== 'auto'
            ? { aspectRatio }
            : { minHeight: '200px' }
      }
    >
      {/* Main skeleton area */}
      <div className="w-full h-full surface-tertiary animate-shimmer relative">
        {/* Play button skeleton for videos */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full surface-elevated animate-pulse opacity-70"></div>
        </div>

        {/* Duration badge skeleton */}
        <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1">
          <div className="w-8 h-3 surface-elevated rounded animate-pulse"></div>
        </div>

        {/* Action button skeleton */}
        <div className="absolute top-2 right-2">
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
  ))

  if (viewMode === 'masonry') {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-6 space-y-3 md:space-y-6">
        {skeletons}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="group card-elevated rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Thumbnail skeleton */}
              <div className="relative w-full sm:w-48 h-48 sm:h-32 flex-shrink-0 surface-tertiary animate-shimmer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full surface-elevated animate-pulse opacity-70"></div>
                </div>
              </div>

              {/* Content skeleton */}
              <div className="flex-1 p-4">
                <div className="w-3/4 h-5 surface-elevated rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 surface-elevated rounded animate-pulse mb-3"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-3 surface-elevated rounded animate-pulse"></div>
                    <div className="w-12 h-3 surface-elevated rounded animate-pulse"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded-lg surface-elevated animate-pulse"></div>
                    <div className="w-8 h-8 rounded-lg surface-elevated animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default grid layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
      {skeletons}
    </div>
  )
}
