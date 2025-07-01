'use client'

import { useState, useRef, useEffect } from 'react'
import { Play } from 'lucide-react'
import { getStorageUrl } from '@/utils/storage-helper'

const VideoThumbnail = ({
  video,
  onCarouselOpen,
  showPurchaseButton = true,
  showDownloadButton = true,
  onPurchase,
  onDownload,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbnail, setThumbnail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(16 / 9) // Default aspect ratio
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Generate thumbnail from video first frame
  useEffect(() => {
    const generateThumbnail = () => {
      const videoElement = videoRef.current
      const canvas = canvasRef.current

      if (!videoElement || !canvas) return

      const context = canvas.getContext('2d')

      const onLoadedData = () => {
        try {
          // Get video dimensions
          const videoWidth = videoElement.videoWidth
          const videoHeight = videoElement.videoHeight

          // Calculate and set aspect ratio
          const ratio = videoWidth / videoHeight
          setAspectRatio(ratio)

          // Set canvas dimensions to match video
          canvas.width = videoWidth
          canvas.height = videoHeight

          // Draw first frame to canvas
          context.drawImage(videoElement, 0, 0, videoWidth, videoHeight)

          // Try to convert canvas to data URL
          try {
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
            setThumbnail(thumbnailDataUrl)
            setIsLoading(false)
          } catch (canvasError) {
            console.warn('Canvas tainted, using video element directly:', canvasError.message)
            // Fallback: use the video element directly instead of canvas thumbnail
            setThumbnail(null) // This will trigger the fallback UI
            setHasError(false) // Don't show error state, just use fallback
            setIsLoading(false)
          }

          // Apply aspect ratio to container
          if (containerRef.current) {
            containerRef.current.style.aspectRatio = `${videoWidth} / ${videoHeight}`
          }
        } catch (error) {
          console.error('Error generating thumbnail:', error)
          setHasError(true)
          setIsLoading(false)
        }
      }

      const onError = error => {
        console.error('Video failed to load for thumbnail:', video.filePath, error)
        setHasError(true)
        setIsLoading(false)
      }

      videoElement.addEventListener('loadeddata', onLoadedData)
      videoElement.addEventListener('error', onError)

      // Set video source and load - convert storage path to full URL
      const videoUrl = getStorageUrl(video.filePath)
      if (videoUrl) {
        videoElement.src = videoUrl
        videoElement.currentTime = 0.1 // Seek to 0.1s to get a frame
      } else {
        onError(new Error('Invalid video path'))
      }

      return () => {
        videoElement.removeEventListener('loadeddata', onLoadedData)
        videoElement.removeEventListener('error', onError)
      }
    }

    generateThumbnail()
  }, [video.filePath])

  const handleVideoClick = e => {
    e.stopPropagation()

    if (isPlaying) {
      // Pause video
      videoRef.current?.pause()
      setIsPlaying(false)
    } else {
      // Start playing video
      videoRef.current?.play()
      setIsPlaying(true)
    }
  }

  const handleThumbnailClick = () => {
    // Open carousel on thumbnail click
    onCarouselOpen()
  }

  const handlePurchase = e => {
    e.stopPropagation()
    onPurchase?.(video, e)
  }

  const handleDownload = e => {
    e.stopPropagation()
    onDownload?.(video, e)
  }

  const formatDuration = seconds => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="group bg-[#1a1d24] rounded-xl overflow-hidden cursor-pointer hover:bg-[#1f2228] transition-all duration-200 shadow-lg hover:shadow-xl w-[60%] mx-auto">
      <div
        ref={containerRef}
        className="relative bg-gray-900 min-h-[200px]"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {/* Hidden video element for thumbnail generation */}
        <video ref={videoRef} className="hidden" muted preload="metadata" crossOrigin="anonymous" />

        {/* Hidden canvas for thumbnail generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Thumbnail or Video Display */}
        {isPlaying ? (
          // Playing video
          <video
            src={getStorageUrl(video.filePath)}
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted={false}
            crossOrigin="anonymous"
            onClick={handleVideoClick}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          // Thumbnail view
          <div className="relative w-full h-full cursor-pointer" onClick={handleThumbnailClick}>
            {isLoading ? (
              // Loading state
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : hasError ? (
              // Error state - fallback
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-600 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-400">Video Preview</p>
                </div>
              </div>
            ) : !thumbnail ? (
              // No thumbnail (canvas tainted) - show video element as preview
              <video
                src={getStorageUrl(video.filePath)}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                crossOrigin="anonymous"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              // Thumbnail image
              <img
                src={thumbnail}
                alt={video.name || video.filename}
                className="w-full h-full object-cover"
              />
            )}

            {/* YouTube-style play button overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 rounded-full p-4 transform hover:scale-110 transition-all duration-200 shadow-lg">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Purchase/Download badges */}
        <div className="absolute top-2 left-2">
          {video.isPurchased ? (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              PURCHASED
            </span>
          ) : (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              PREVIEW
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {video.isPurchased && showDownloadButton && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-green-500/80 hover:bg-green-500 text-white transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          )}

          {!video.isPurchased && showPurchaseButton && (
            <button
              onClick={handlePurchase}
              className="p-2 rounded-lg bg-orange-500/80 hover:bg-orange-500 text-white transition-colors"
              title="Purchase"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Video info */}
      <div className="p-4">
        <h3 className="text-white font-medium text-sm mb-1 truncate">
          {video.name || video.filename}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          <span>{video.downloadCount || 0} downloads</span>
        </div>
      </div>
    </div>
  )
}

export default VideoThumbnail
