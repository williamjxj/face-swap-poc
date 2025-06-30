'use client'

import { useState, useEffect } from 'react'
import VideoCarousel from '@/components/VideoCarousel'
import VideoThumbnail from '@/components/VideoThumbnail'
import { useToast } from '@/contexts/ToastContext'

export default function VideoCarouselPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const toast = useToast()

  // Helper function to determine media type (same as gallery)
  const getMediaType = media => {
    // First check explicit type
    if (media.type) {
      return media.type
    }

    // Then check mimeType
    if (media.mimeType) {
      if (media.mimeType.startsWith('video/')) return 'video'
      if (media.mimeType === 'image/gif') return 'gif'
      if (media.mimeType.startsWith('image/')) return 'image'
    }

    // Finally check file extension
    if (media.filePath) {
      if (media.filePath.match(/\.(mp4|webm|mov|avi)$/i)) return 'video'
      if (media.filePath.match(/\.gif$/i)) return 'gif'
      if (media.filePath.match(/\.(jpg|jpeg|png|webp|svg)$/i)) return 'image'
    }

    // Default fallback
    return 'unknown'
  }

  // Format video duration (same as gallery)
  const formatDuration = seconds => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get video duration for display (same as gallery)
  const getVideoDuration = item => {
    // Check if item has duration property
    if (item.duration) {
      return formatDuration(item.duration)
    }
    // Default fallback
    return '00:00'
  }

  // Load videos from API (same approach as gallery)
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch('/api/generated-media')
        if (!response.ok) {
          throw new Error('Failed to load videos')
        }
        const data = await response.json()

        if (data.files) {
          // Process data same as gallery, but filter for videos only
          const allMedia = data.files.map(item => ({
            ...item,
            fileSize: item.fileSize ? item.fileSize.toString() : '0',
            downloadCount: item.downloadCount || 0,
            description: item.description || `Generated content: ${item.name}`,
            // Ensure proper video path - try multiple approaches
            filePath: item.filePath.startsWith('http')
              ? item.filePath
              : item.filePath.startsWith('/')
                ? `${window.location.origin}${item.filePath}`
                : `${window.location.origin}/${item.filePath}`,
          }))

          // Filter for videos only (same logic as gallery)
          const videoData = allMedia.filter(item => {
            const mediaType = getMediaType(item)
            return mediaType === 'video'
          })

          console.log('Loaded media items:', allMedia.length)
          console.log('Filtered video items:', videoData.length)
          console.log('Sample video data:', videoData.slice(0, 2))
          console.log(
            'Sample video paths:',
            videoData.slice(0, 3).map(v => v.filePath)
          )

          // Test if first video is accessible
          if (videoData.length > 0) {
            const testPath = videoData[0].filePath
            console.log('Testing video accessibility:', testPath)
            fetch(testPath, { method: 'HEAD' })
              .then(response => {
                console.log('Video accessibility test:', response.status, response.statusText)
              })
              .catch(error => {
                console.error('Video accessibility test failed:', error)
              })
          }
          setVideos(videoData)
        }
      } catch (err) {
        console.error('Error loading videos:', err)
        setError(err.message)
        toast.error('Failed to load videos')
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [toast])

  // Handle opening carousel with specific video
  const handleOpenCarousel = (index = 0) => {
    setSelectedVideoIndex(index)
    setIsCarouselOpen(true)
  }

  // Handle closing carousel
  const handleCloseCarousel = () => {
    setIsCarouselOpen(false)
  }

  // Handle download action
  const handleDownload = async video => {
    if (!video.isPaid) {
      toast.warning('Please purchase the video to download')
      return
    }

    try {
      const response = await fetch(`/api/download-media?filename=${video.name}`)
      if (!response.ok) {
        throw new Error('Failed to download video')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = video.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Video downloaded successfully!')
    } catch (error) {
      console.error('Error downloading video:', error)
      toast.error('Failed to download video')
    }
  }

  // Handle purchase action
  const handlePurchase = video => {
    toast.info(`Opening purchase modal for: ${video.name}`)
    // In a real app, this would open a payment modal
    console.log('Purchase video:', video)
  }

  // Handle show details action
  const handleShowDetails = video => {
    toast.info(`Showing details for: ${video.name}`)
    // In a real app, this would open a details modal
    console.log('Show details for video:', video)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-2">Error Loading Videos</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Header */}
      <div className="bg-[#1a1d24] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Video Carousel Demo
              </h1>
              <p className="text-gray-400 mt-2">
                Interactive video carousel with navigation and controls
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{videos.length} videos</span>
              <span>•</span>
              <span>Click any video to open carousel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Videos Found</h2>
            <p className="text-gray-500">
              Generate some videos in the face-fusion page to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            {videos.map((video, index) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                onCarouselOpen={() => handleOpenCarousel(index)}
                onPurchase={handlePurchase}
                onDownload={handleDownload}
                showPurchaseButton={!video.isPurchased}
                showDownloadButton={video.isPurchased}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Carousel */}
      <VideoCarousel
        videos={videos}
        initialIndex={selectedVideoIndex}
        isOpen={isCarouselOpen}
        onClose={handleCloseCarousel}
        onDownload={handleDownload}
        onPurchase={handlePurchase}
        onShowDetails={handleShowDetails}
      />
    </div>
  )
}
