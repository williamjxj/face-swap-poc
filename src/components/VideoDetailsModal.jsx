'use client'
import { useState, useEffect } from 'react'
import { X, Download, ShoppingCart } from 'lucide-react'
import { getStorageUrl } from '@/utils/storage-helper'
import { PRICING_CONFIG } from '@/config/pricing'

export default function VideoDetailsModal({ video, isOpen, onClose, onDownload, onPurchase }) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Auto-play when modal opens (like carousel)
  useEffect(() => {
    if (isOpen && video) {
      setTimeout(() => {
        const videoElement = document.getElementById('details-video')
        if (videoElement && videoElement.readyState >= 2) {
          videoElement.play().catch(error => {
            console.log('Auto-play prevented or failed:', error.message)
          })
          setIsPlaying(true)
        }
      }, 200)
    }
  }, [isOpen, video])

  // Handle keyboard shortcuts (like carousel)
  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          const videoElement = document.getElementById('details-video')
          if (videoElement) {
            if (isPlaying) {
              videoElement.pause()
            } else {
              videoElement.play()
            }
            setIsPlaying(!isPlaying)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPlaying, onClose])

  if (!isOpen || !video) return null

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

      {/* Video Container */}
      <div className="relative flex items-center justify-center w-full h-full max-w-[95vw] max-h-[90vh] mx-4">
        <video
          id="details-video"
          src={getStorageUrl(video.filePath)}
          className="max-w-full max-h-full object-contain rounded-lg"
          controls
          poster={getStorageUrl(video.thumbnailPath)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedData={e => {
            // Auto-play when video loads (only if not already playing)
            const videoElement = e.target
            if (videoElement && isOpen && !isPlaying && videoElement.paused) {
              videoElement.play().catch(error => {
                console.log('Video auto-play prevented:', error.message)
              })
              setIsPlaying(true)
            }
          }}
          onError={e => {
            console.error('Video loading error:', e.target.error)
            setIsPlaying(false)
          }}
          style={{ aspectRatio: 'auto' }}
        />

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {video.name || video.filename || 'Untitled Video'}
              </h3>
              {video.description && (
                <p className="text-gray-300 text-sm mb-3">{video.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                <span>{formatDuration(video.duration)}</span>
                <span>{video.downloadCount || 0} downloads</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-6">
              {video.isPurchased || video.isPaid ? (
                <button
                  onClick={() => onDownload(video)}
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
                  onClick={() => onPurchase(video)}
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

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {video.isPurchased || video.isPaid ? (
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
    </div>
  )
}
