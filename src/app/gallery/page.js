'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Loading from '@/components/Loading'
import VideoPlayerWithLoading from '@/components/VideoPlayerWithLoading'
import { Download, Play, Eye, Lock } from 'lucide-react'
import CloseButton from '@/components/CloseButton'

export default function GalleryPage() {
  const [mediaItems, setMediaItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('video')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [error, setError] = useState(null)

  // Define tabs for sidebar
  const tabs = [
    { id: 'video', label: 'Video' },
    { id: 'image', label: 'Image' },
    { id: 'gif', label: 'GIF' },
    { id: 'multi-face', label: 'Multi-face' },
  ]

  // Fetch media items from the API
  useEffect(() => {
    const fetchMediaItems = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/generated-media')

        if (!response.ok) {
          throw new Error('Failed to fetch media items')
        }

        const data = await response.json()
        setMediaItems(data.files || [])
      } catch (err) {
        console.error('Error fetching media:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMediaItems()
  }, [])

  // Helper function to determine media type more reliably
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

  // Filter media items based on active tab
  const filteredMedia = mediaItems.filter(media => {
    const mediaType = getMediaType(media)

    if (activeTab === 'video') {
      return mediaType === 'video'
    } else if (activeTab === 'image') {
      return mediaType === 'image'
    } else if (activeTab === 'gif') {
      return mediaType === 'gif'
    } else if (activeTab === 'multi-face') {
      return media.type === 'multi-face'
    }
    return false
  })

  // Handle media selection
  const handleMediaClick = media => {
    setSelectedMedia(media)
  }

  // Handle media download
  const handleDownload = async (media, e) => {
    e.stopPropagation()

    if (!media.isPaid) {
      setError('Please purchase this media to download')
      return
    }

    try {
      const response = await fetch(`/api/download-media?filename=${media.name}`)
      if (!response.ok) {
        throw new Error('Failed to download media')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = media.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Update download count
      fetch(`/api/generated-media/${media.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...media,
          downloadCount: (media.downloadCount || 0) + 1,
        }),
      })
    } catch (err) {
      console.error('Error downloading media:', err)
      setError(err.message)
    }
  }

  // Handle play count increment when viewing media
  const incrementPlayCount = media => {
    fetch(`/api/generated-media/${media.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...media,
        playCount: (media.playCount || 0) + 1,
      }),
    })
  }

  return (
    <div className="flex-grow flex h-[calc(100vh-80px)]">
      {/* Left sidebar with tabs */}
      <div className="w-60 bg-[#1a1d24] border-r border-gray-800 md:block hidden">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-6">Gallery</h2>
          <div className="flex flex-col space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-[#2a2d34] hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d24] border-t border-gray-800 z-10">
        <div className="flex justify-between px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 text-xs font-medium text-center transition-colors cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'text-blue-500 border-t-2 border-blue-500'
                    : 'text-gray-400'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-[#141518] p-4 md:p-6 overflow-y-auto pb-16 md:pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loading />
            <p className="text-gray-400 mt-4">Loading your media...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-gray-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No {activeTab} media found</h3>
            <p className="text-gray-500 max-w-md">
              Create some amazing content in Face Swap Generator to see it here.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Gallery
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {filteredMedia.map(media => (
                <div
                  key={media.id}
                  className="group relative bg-[#1a1d24] rounded-xl overflow-hidden cursor-pointer hover:transform hover:scale-[1.02] transition-all duration-200"
                  onClick={() => {
                    handleMediaClick(media)
                    incrementPlayCount(media)
                  }}
                >
                  <div className="relative aspect-[116/176] overflow-hidden">
                    {getMediaType(media) === 'video' ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-90 transition-opacity" />
                        </div>
                        <video
                          src={
                            media.isPaid ? media.filePath : media.watermarkPath || media.filePath
                          }
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onError={e => {
                            console.error('Video error:', e)
                            // Add a placeholder or fallback content
                            const fallbackDiv = document.createElement('div')
                            fallbackDiv.className =
                              'w-full h-full flex items-center justify-center bg-[#2a2d34]'
                            fallbackDiv.innerHTML =
                              '<svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                            e.target.parentNode.appendChild(fallbackDiv)
                            e.target.style.display = 'none'
                          }}
                        />
                        {!media.isPaid && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                            <Lock className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Image
                          src={
                            media.thumbnailPath
                              ? media.thumbnailPath
                              : media.filePath && !media.filePath.match(/\.(mp4|webm|mov|avi)$/i)
                                ? media.filePath
                                : '/placeholder-thumbnail.svg'
                          }
                          alt={media.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                          priority={false}
                        />
                      </>
                    )}

                    {!media.isPaid && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs px-2 py-1 rounded-md font-medium z-20">
                        PREVIEW
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex justify-between items-center">
                        <div className="text-white font-medium truncate">{media.name}</div>
                        <div className="flex space-x-2">
                          <button
                            onClick={e => handleDownload(media, e)}
                            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                            title={media.isPaid ? 'Download' : 'Purchase to download'}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          <span>{media.playCount || 0}</span>
                        </div>
                        <div>{new Date(media.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Media preview modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative bg-[#1a1d24] rounded-xl max-w-4xl w-[95%] md:w-[90%] max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10">
              <CloseButton onClick={() => setSelectedMedia(null)} variant="gallery" size="medium" />
            </div>

            <div className="p-4">
              {getMediaType(selectedMedia) === 'video' ? (
                <VideoPlayerWithLoading
                  src={selectedMedia.filePath}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain"
                  playsInline
                  thumbnail={selectedMedia.thumbnailPath}
                  watermarkedSrc={selectedMedia.watermarkPath}
                  showWatermarked={!selectedMedia.isPaid}
                  showDuration={true}
                  optimizedLoading={true}
                />
              ) : (
                <div className="flex justify-center">
                  <div className="relative max-w-full max-h-[70vh]">
                    {selectedMedia.filePath &&
                    (getMediaType(selectedMedia) === 'image' ||
                      getMediaType(selectedMedia) === 'gif') ? (
                      <Image
                        src={selectedMedia.filePath}
                        alt={selectedMedia.name}
                        width={800}
                        height={800}
                        className="max-h-[70vh] object-contain"
                        priority={true}
                        onError={e => {
                          // Handle image load errors
                          e.target.onerror = null
                          e.target.src = '/placeholder-thumbnail.svg'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center p-10 bg-[#1a1d24] rounded-lg">
                        <p className="text-white text-lg">Image preview not available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-medium text-white">{selectedMedia.name}</h3>
                <button
                  onClick={e => handleDownload(selectedMedia, e)}
                  className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 
                    ${
                      selectedMedia.isPaid
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  disabled={!selectedMedia.isPaid}
                >
                  <Download size={16} />
                  <span>{selectedMedia.isPaid ? 'Download' : 'Purchase to Download'}</span>
                </button>
              </div>

              <div className="mt-2 text-sm text-gray-400">
                Created: {new Date(selectedMedia.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
