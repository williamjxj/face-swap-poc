'use client'

export default function TemplateSkeleton({
  count = 8,
  aspectRatio = '116/176',
  className = '',
  showUploadBox = true,
}) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 card-elevated ${className}`}
      style={{ aspectRatio }}
    >
      <div className="relative group w-full h-full">
        {/* Main skeleton area */}
        <div className="w-full h-full surface-tertiary animate-shimmer relative">
          {/* Play button skeleton for videos */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 surface-elevated rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Delete button skeleton */}
        <div className="absolute top-1 right-1 bg-gray-800/80 rounded-full w-6 h-6 flex items-center justify-center">
          <div className="w-3 h-3 surface-elevated rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  ))

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Upload box placeholder if needed */}
        {showUploadBox && (
          <div className="w-[116px] h-[176px]">
            <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center surface-secondary animate-pulse">
              <div className="w-8 h-8 surface-tertiary rounded-lg mb-2"></div>
              <div className="w-16 h-3 surface-tertiary rounded mb-1"></div>
              <div className="w-20 h-2 surface-tertiary rounded"></div>
            </div>
          </div>
        )}

        {/* Template skeletons */}
        {skeletons}
      </div>
    </div>
  )
}
