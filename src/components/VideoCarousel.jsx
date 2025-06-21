'use client'
import { useState, useEffect } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ShoppingCart,
  Info,
  Play,
  Pause,
} from 'lucide-react'

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

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
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
  }, [isOpen, currentIndex])

  if (!isOpen || !videos || videos.length === 0) return null

  const currentVideo = videos[currentIndex]

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
      <div className="relative max-w-6xl max-h-[90vh] w-full mx-4">
        <video
          id="carousel-video"
          src={currentVideo.filePath}
          className="w-full h-full object-contain rounded-lg"
          controls
          poster={currentVideo.thumbnailPath}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
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
                  title={`Purchase for $${currentVideo.price || '9.99'}`}
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/50 p-3 rounded-lg backdrop-blur-sm max-w-md overflow-x-auto">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? 'border-blue-500 scale-110'
                  : 'border-transparent hover:border-gray-400'
              }`}
            >
              <img
                src={video.thumbnailPath || video.filePath}
                alt={video.name || video.filename}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
