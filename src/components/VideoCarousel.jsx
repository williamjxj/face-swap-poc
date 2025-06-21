'use client'
import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ShoppingCart, Info } from 'lucide-react'
import { PRICING_CONFIG } from '@/config/pricing'

export default function VideoCarousel({
  videos,
  initialIndex = 0,
  isOpen,
  onClose,
  onDownload,
  onPurchase,
  onShowDetails,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbnails, setThumbnails] = useState({})
  const thumbnailStripRef = useRef(null)

  // Define functions first
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % videos.length)
    setIsPlaying(false)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + videos.length) % videos.length)
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    const video = document.getElementById('carousel-video')
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Function to scroll thumbnail strip to show current video
  const scrollThumbnailStrip = index => {
    if (!thumbnailStripRef.current) return

    const strip = thumbnailStripRef.current
    const thumbnailButtons = strip.querySelectorAll('button')

    if (thumbnailButtons[index]) {
      const button = thumbnailButtons[index]
      const stripRect = strip.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      // Calculate the position to center the button
      const stripCenter = stripRect.width / 2
      const buttonCenter = buttonRect.left - stripRect.left + buttonRect.width / 2
      const scrollOffset = buttonCenter - stripCenter

      // Smooth scroll to center the current thumbnail
      strip.scrollTo({
        left: strip.scrollLeft + scrollOffset,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    setCurrentIndex(initialIndex)
    // Auto-play video when carousel opens (YouTube-like behavior)
    if (isOpen) {
      setTimeout(() => {
        const video = document.getElementById('carousel-video')
        if (video && video.readyState >= 2) {
          // Check if video has enough data
          video.play().catch(error => {
            console.log('Initial auto-play prevented or failed:', error.message)
          })
          setIsPlaying(true)
        }
      }, 200) // Slightly longer delay to ensure video element is ready
    }
  }, [initialIndex, isOpen])

  // Auto-play when video changes
  useEffect(() => {
    if (isOpen && currentIndex >= 0) {
      const video = document.getElementById('carousel-video')
      if (video) {
        // Stop any current playback first
        video.pause()
        setIsPlaying(false)

        // Wait for video to be ready before playing
        const handleCanPlay = () => {
          video.play().catch(error => {
            console.log('Auto-play prevented or failed:', error.message)
          })
          setIsPlaying(true)
          video.removeEventListener('canplay', handleCanPlay)
        }

        video.addEventListener('canplay', handleCanPlay)
        video.load() // Force reload the video

        // Cleanup function
        return () => {
          video.removeEventListener('canplay', handleCanPlay)
        }
      }
    }
  }, [currentIndex, isOpen])

  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, videos.length, goToPrevious, goToNext, togglePlayPause])

  // Scroll thumbnail strip when current video changes
  useEffect(() => {
    if (isOpen && videos.length > 1) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollThumbnailStrip(currentIndex)
      }, 100)
    }
  }, [currentIndex, isOpen, videos.length])

  // Generate thumbnails for all videos
  useEffect(() => {
    if (!isOpen || !videos || videos.length === 0) return

    const generateThumbnails = async () => {
      const newThumbnails = {}

      for (const video of videos) {
        if (thumbnails[video.id]) continue // Skip if already generated

        try {
          const thumbnail = await generateVideoThumbnail(video.filePath)
          newThumbnails[video.id] = thumbnail
        } catch (error) {
          console.error('Failed to generate thumbnail for:', video.filePath, error)
          newThumbnails[video.id] = null // Mark as failed
        }
      }

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails(prev => ({ ...prev, ...newThumbnails }))
      }
    }

    generateThumbnails()
  }, [isOpen, videos, thumbnails])

  // Helper function to generate video thumbnail
  const generateVideoThumbnail = videoPath => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      video.crossOrigin = 'anonymous'
      video.muted = true

      video.onloadeddata = () => {
        try {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          video.currentTime = 0.1 // Seek to 0.1s to get a frame
        } catch (error) {
          reject(error)
        }
      }

      video.onseeked = () => {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(thumbnailDataUrl)
        } catch (error) {
          reject(error)
        }
      }

      video.onerror = () => {
        reject(new Error('Video failed to load'))
      }

      video.src = videoPath
    })
  }

  if (!isOpen || !videos || videos.length === 0) return null

  const currentVideo = videos[currentIndex]

  const formatDuration = seconds => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Navigation Arrows */}
      {videos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Video Container */}
      <div className="relative flex items-center justify-center w-full h-full max-w-[95vw] max-h-[90vh] mx-4">
        <video
          key={`video-${currentIndex}-${currentVideo.id}`}
          id="carousel-video"
          src={currentVideo.filePath}
          className="max-w-full max-h-full object-contain rounded-lg"
          controls
          poster={currentVideo.thumbnailPath}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedData={e => {
            // Auto-play when video loads (only if not already playing)
            const video = e.target
            if (video && isOpen && !isPlaying && video.paused) {
              video.play().catch(error => {
                console.log('Video auto-play prevented:', error.message)
              })
              setIsPlaying(true)
            }
          }}
          onError={e => {
            console.error('Video loading error:', e.target.error)
            setIsPlaying(false)
          }}
          onAbort={() => {
            console.log('Video loading aborted')
            setIsPlaying(false)
          }}
          style={{ aspectRatio: 'auto' }}
        />

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {currentVideo.name || currentVideo.filename || 'Untitled Video'}
              </h3>
              {currentVideo.description && (
                <p className="text-gray-300 text-sm mb-3">{currentVideo.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{new Date(currentVideo.createdAt).toLocaleDateString()}</span>
                <span>{formatDuration(currentVideo.duration)}</span>
                <span>{currentVideo.downloadCount || 0} downloads</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-6">
              <button
                onClick={() => onShowDetails(currentVideo)}
                className="group p-3 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white transition-all duration-200 backdrop-blur-sm"
                title="View Details"
              >
                <Info
                  size={16}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              </button>

              {currentVideo.isPaid ? (
                <button
                  onClick={() => onDownload(currentVideo)}
                  className="group px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  title="Download"
                >
                  <Download
                    size={16}
                    className="group-hover:scale-110 transition-transform duration-200"
                  />
                  <span>Download</span>
                </button>
              ) : (
                <button
                  onClick={() => onPurchase(currentVideo)}
                  className="group px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  title={`Purchase for ${PRICING_CONFIG.getFormattedPrice()}`}
                >
                  <ShoppingCart
                    size={16}
                    className="group-hover:scale-110 transition-transform duration-200"
                  />
                  <span>Purchase</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Counter */}
        {videos.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {videos.length}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {currentVideo.isPaid ? (
            <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
              PURCHASED
            </span>
          ) : (
            <span className="bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
              PREVIEW
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {videos.length > 1 && (
        <div
          ref={thumbnailStripRef}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/50 p-3 rounded-lg backdrop-blur-sm max-w-md overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none' /* Firefox */,
            msOverflowStyle: 'none' /* IE and Edge */,
            paddingLeft: '120px' /* Add padding for centering */,
            paddingRight: '120px',
          }}
        >
          {videos.map((video, index) => {
            const thumbnail = thumbnails[video.id]
            return (
              <button
                key={video.id}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsPlaying(false)
                }}
                className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                  index === currentIndex
                    ? 'border-blue-500 scale-110'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={video.name || video.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    {thumbnail === null ? (
                      // Failed to load
                      <div className="text-gray-400 text-xs">✕</div>
                    ) : (
                      // Loading
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
