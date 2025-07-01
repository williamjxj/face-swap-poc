'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { formatDuration } from '@/utils/helper'
import { getStorageUrl } from '@/utils/storage-helper'

// Inline ProgressLoader component (previously a separate component)
function ProgressLoader({ progress, isIndeterminate = false, size = 'medium', color = 'blue' }) {
  const [dots, setDots] = useState('.')

  // For the animated dots when in indeterminate mode
  useEffect(() => {
    if (!isIndeterminate) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isIndeterminate])

  // Size variants
  const sizeClasses = {
    small: 'w-16 h-1',
    medium: 'w-32 h-2',
    large: 'w-48 h-3',
    full: 'w-full h-2',
  }

  // Color variants
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
    gray: 'bg-gray-600',
  }

  // Get appropriate classes
  const containerClass = sizeClasses[size] || sizeClasses.medium
  const barColorClass = colorClasses[color] || colorClasses.blue

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className={`${containerClass} bg-gray-200 rounded-full overflow-hidden`}>
        {!isIndeterminate ? (
          <div
            className={`h-full ${barColorClass} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.max(1, Math.min(100, progress))}%` }}
          ></div>
        ) : (
          <div
            className={`h-full ${barColorClass} rounded-full animate-pulse`}
            style={{ width: '30%', transform: 'translateX(-5%) translateX(10%)' }}
          ></div>
        )}
      </div>
      {isIndeterminate && <div className="text-xs text-gray-600 font-medium">Loading{dots}</div>}
      {!isIndeterminate && progress > 0 && (
        <div className="text-xs text-gray-600 font-medium">{progress}%</div>
      )}
    </div>
  )
}

export default function VideoPlayerWithLoading({
  src,
  className,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  playsInline = true,
  onLoadStart,
  onLoadEnd,
  preloadStrategy = 'metadata', // 'none', 'metadata', 'auto'
  optimizedLoading = true,
  thumbnail = null,
  showDuration = false,
}) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadingError, setLoadingError] = useState(null)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef(null)
  const [showVideo, setShowVideo] = useState(false)

  // Convert storage path to full URL if needed
  const videoUrl = getStorageUrl(src) || src

  useEffect(() => {
    // Reset states when src changes
    setLoading(true)
    setProgress(0)
    setLoadingError(null)
    setShowVideo(false)

    if (onLoadStart) {
      onLoadStart()
    }
  }, [src, onLoadStart])

  // Optimize loading strategy for better performance
  useEffect(() => {
    if (!videoRef.current || !optimizedLoading) return

    // Using Media Source Extensions for more efficient loading
    // when available and appropriate for larger videos
    if (
      window.MediaSource &&
      src?.endsWith('.mp4') &&
      videoRef.current.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
    ) {
      videoRef.current.preload = preloadStrategy
    }
  }, [src, preloadStrategy, optimizedLoading])

  const handleCanPlay = () => {
    setProgress(100)
    setLoading(false)
    setShowVideo(true)
    if (onLoadEnd) {
      onLoadEnd()
    }
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const loadedPercentage = (videoRef.current.buffered.end(0) / videoRef.current.duration) * 100
      setProgress(Math.min(loadedPercentage, 100))
    }
  }

  const handleError = e => {
    setLoadingError(`Video failed to load: ${e.target.error?.message || 'Unknown error'}`)
    setLoading(false)
  }

  const handleLoadStart = () => {
    setLoading(true)
    setProgress(0)
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 z-10">
          <ProgressLoader progress={progress} isIndeterminate={progress === 0} size="full" />
        </div>
      )}

      {!showVideo && thumbnail && (
        <div className="absolute inset-0 z-0">
          <Image
            src={thumbnail}
            alt="Video thumbnail"
            className="object-cover"
            fill
            sizes="100vw"
            priority
            onError={e => {
              // Handle loading error for thumbnail by using a default placeholder
              e.target.src = '/placeholder-thumbnail.svg'
            }}
          />
        </div>
      )}

      {loadingError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="text-white text-center p-4 max-w-sm">
            <p className="text-red-400 font-bold mb-2">Error</p>
            <p className="text-sm">{loadingError}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full ${className || ''}`}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline={playsInline}
        onCanPlay={handleCanPlay}
        onProgress={handleProgress}
        onLoadStart={handleLoadStart}
        onError={handleError}
        style={{ opacity: showVideo ? 1 : 0 }}
        preload={preloadStrategy}
      />

      {showDuration && duration > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  )
}
