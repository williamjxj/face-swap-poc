'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Loading from '@/components/Loading'
import VideoPlayerWithLoading from '@/components/VideoPlayerWithLoading'
import { Download, Play, Eye, Lock, ChevronDown } from 'lucide-react'
import CloseButton from '@/components/CloseButton'

export default function GalleryPage() {
  const [mediaItems, setMediaItems] = useState([])
  const [targetTemplates, setTargetTemplates] = useState([])
  const [faceSources, setFaceSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('video')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [error, setError] = useState(null)
  const [contentType, setContentType] = useState('generatedMedia')
  const [contentTypeDropdownOpen, setContentTypeDropdownOpen] = useState(false)

  // Content type options
  const contentTypes = [
    { id: 'generatedMedia', label: 'Generated Media' },
    { id: 'targetTemplates', label: 'Target Templates' },
    { id: 'faceSources', label: 'Face Sources' },
  ]

  // Define tabs for sidebar
  const tabs = [
    { id: 'video', label: 'Video' },
    { id: 'image', label: 'Image' },
    { id: 'gif', label: 'GIF' },
    { id: 'multi-face', label: 'Multi-face' },
  ]

  // Fetch media items from the API based on content type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (contentType === 'generatedMedia') {
          const response = await fetch('/api/generated-media')
          if (!response.ok) throw new Error('Failed to fetch generated media')
          const data = await response.json()
          setMediaItems(data.files || [])
        } else if (contentType === 'targetTemplates') {
          const response = await fetch('/api/templates')
          if (!response.ok) throw new Error('Failed to fetch templates')
          const data = await response.json()
          setTargetTemplates(data.templates || [])
        } else if (contentType === 'faceSources') {
          const response = await fetch('/api/face-sources')
          if (!response.ok) throw new Error('Failed to fetch face sources')
          const data = await response.json()
          setFaceSources(data.files || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [contentType])

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

  // Filter media items based on active tab and content type
  const filteredItems = () => {
    if (contentType === 'generatedMedia') {
      return mediaItems.filter(media => {
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
    } else if (contentType === 'targetTemplates') {
      return targetTemplates.filter(template => {
        const mediaType = getMediaType(template)

        if (activeTab === 'video') {
          return mediaType === 'video'
        } else if (activeTab === 'image') {
          return mediaType === 'image'
        } else if (activeTab === 'gif') {
          return mediaType === 'gif'
        } else if (activeTab === 'multi-face') {
          return template.type === 'multi-face'
        }
        return false
      })
    } else if (contentType === 'faceSources') {
      return faceSources
    }

    return []
  }

  // Handle media selection
  const handleMediaClick = media => {
    setSelectedMedia(media)
  }

  // Handle media download
  const handleDownload = async (media, e) => {
    e.stopPropagation()

    if (contentType === 'generatedMedia' && !media.isPaid) {
      setError('Please purchase this media to download')
      return
    }

    try {
      const endpoint =
        contentType === 'generatedMedia'
          ? `/api/download-media?filename=${media.name}`
          : `/api/download-${contentType === 'targetTemplates' ? 'template' : 'source'}?filename=${media.filename}`

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(
          `Failed to download ${contentType === 'generatedMedia' ? 'media' : contentType === 'targetTemplates' ? 'template' : 'face source'}`
        )
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = media.name || media.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Update download count for generated media
      if (contentType === 'generatedMedia') {
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
      }
    } catch (err) {
      console.error(`Error downloading ${contentType}:`, err)
      setError(err.message)
    }
  }

  // Handle play count increment when viewing media
  const incrementPlayCount = media => {
    if (contentType === 'generatedMedia') {
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
    } else if (contentType === 'targetTemplates') {
      fetch(`/api/templates/${media.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...media,
          usageCount: (media.usageCount || 0) + 1,
          lastUsedAt: new Date().toISOString(),
        }),
      }).catch(err => console.error('Error updating template usage count:', err))
    }
  }

  // Toggle content type dropdown
  const toggleContentTypeDropdown = () => {
    setContentTypeDropdownOpen(!contentTypeDropdownOpen)
  }

  // Handle selecting a content type
  const handleContentTypeSelect = type => {
    setContentType(type)
    setContentTypeDropdownOpen(false)
    setSelectedMedia(null)
  }

  // Get the current content type label
  const getCurrentContentTypeLabel = () => {
    const currentType = contentTypes.find(type => type.id === contentType)
    return currentType ? currentType.label : 'Generated Media'
  }

  // Get the page title based on content type and active tab
  const getPageTitle = () => {
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1)

    if (contentType === 'generatedMedia') {
      return `${tabLabel} Gallery`
    } else if (contentType === 'targetTemplates') {
      return `${tabLabel} Templates`
    } else if (contentType === 'faceSources') {
      return 'Face Sources'
    }

    return 'Gallery'
  }

  return (
    <div className="flex-grow flex h-[calc(100vh-80px)]">
      {/* Left sidebar with content type dropdown and tabs */}
      <div className="w-60 bg-[#1a1d24] border-r border-gray-800 md:block hidden">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-6">Gallery</h2>

          {/* Content Type Dropdown */}
          <div className="mb-6 relative">
            <button
              onClick={toggleContentTypeDropdown}
              className="w-full px-4 py-3 bg-[#2a2d34] rounded-lg text-white font-medium flex justify-between items-center"
            >
              <span>{getCurrentContentTypeLabel()}</span>
              <ChevronDown
                size={16}
                className={contentTypeDropdownOpen ? 'transform rotate-180' : ''}
              />
            </button>

            {contentTypeDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#2a2d34] rounded-lg shadow-lg overflow-hidden">
                {contentTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleContentTypeSelect(type.id)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-[#3a3d44] transition-colors
                      ${contentType === type.id ? 'bg-blue-600 text-white' : 'text-gray-300'}
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Only show tabs for Generated Media and Target Templates */}
          {(contentType === 'generatedMedia' || contentType === 'targetTemplates') && (
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
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d24] border-t border-gray-800 z-10">
        <div className="flex justify-between px-2">
          {/* Content Type Dropdown for Mobile */}
          <button
            onClick={toggleContentTypeDropdown}
            className="flex-1 py-3 text-xs font-medium text-center transition-colors cursor-pointer text-blue-500 border-t-2 border-blue-500"
          >
            {getCurrentContentTypeLabel()}
          </button>

          {/* Only show tabs for Generated Media and Target Templates on mobile */}
          {(contentType === 'generatedMedia' || contentType === 'targetTemplates') &&
            tabs.map(tab => (
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

        {/* Mobile content type dropdown menu */}
        {contentTypeDropdownOpen && (
          <div className="absolute bottom-16 left-0 right-0 bg-[#2a2d34] border-t border-gray-800 z-20">
            {contentTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleContentTypeSelect(type.id)}
                className={`
                  w-full px-4 py-3 text-left border-b border-gray-700 last:border-b-0
                  ${contentType === type.id ? 'bg-blue-600 text-white' : 'text-gray-300'}
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
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
        ) : filteredItems().length === 0 ? (
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
            <h3 className="text-xl font-medium text-white mb-2">
              No {contentType === 'faceSources' ? 'face sources' : activeTab} found
            </h3>
            <p className="text-gray-500 max-w-md">
              {contentType === 'generatedMedia'
                ? 'Create some amazing content in Face Swap Generator to see it here.'
                : contentType === 'targetTemplates'
                  ? 'Upload target templates to see them here.'
                  : 'Upload face sources to see them here.'}
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">{getPageTitle()}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {filteredItems().map(item => (
                <div
                  key={item.id}
                  className="group relative bg-[#1a1d24] rounded-xl overflow-hidden cursor-pointer hover:transform hover:scale-[1.02] transition-all duration-200"
                  onClick={() => {
                    handleMediaClick(item)
                    incrementPlayCount(item)
                  }}
                >
                  <div className="relative aspect-[116/176] overflow-hidden">
                    {getMediaType(item) === 'video' ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-90 transition-opacity" />
                        </div>
                        <video
                          src={
                            contentType === 'generatedMedia' && !item.isPaid
                              ? item.watermarkPath || item.filePath
                              : item.filePath
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
                        {contentType === 'generatedMedia' && !item.isPaid && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                            <Lock className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Image
                          src={
                            item.thumbnailPath
                              ? item.thumbnailPath
                              : item.filePath && !item.filePath.match(/\.(mp4|webm|mov|avi)$/i)
                                ? item.filePath
                                : '/placeholder-thumbnail.svg'
                          }
                          alt={item.name || item.filename || 'Media item'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                          priority={false}
                        />
                      </>
                    )}

                    {contentType === 'generatedMedia' && !item.isPaid && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs px-2 py-1 rounded-md font-medium z-20">
                        PREVIEW
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex justify-between items-center">
                        <div className="text-white font-medium truncate">
                          {item.name || item.filename || 'Untitled'}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={e => handleDownload(item, e)}
                            className={`p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white ${
                              contentType === 'generatedMedia' && !item.isPaid
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                            title={
                              contentType === 'generatedMedia' && !item.isPaid
                                ? 'Purchase to download'
                                : 'Download'
                            }
                            disabled={contentType === 'generatedMedia' && !item.isPaid}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        {contentType === 'generatedMedia' && (
                          <div className="flex items-center">
                            <Eye size={14} className="mr-1" />
                            <span>{item.playCount || 0}</span>
                          </div>
                        )}
                        {contentType === 'targetTemplates' && (
                          <div className="flex items-center">
                            <Eye size={14} className="mr-1" />
                            <span>{item.usageCount || 0}</span>
                          </div>
                        )}
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
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
                  watermarkedSrc={
                    contentType === 'generatedMedia' ? selectedMedia.watermarkPath : null
                  }
                  showWatermarked={contentType === 'generatedMedia' && !selectedMedia.isPaid}
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
                        alt={selectedMedia.name || selectedMedia.filename || 'Media item'}
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
                <h3 className="text-xl font-medium text-white">
                  {selectedMedia.name || selectedMedia.filename || 'Untitled'}
                </h3>
                <button
                  onClick={e => handleDownload(selectedMedia, e)}
                  className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 
                    ${
                      contentType !== 'generatedMedia' || selectedMedia.isPaid
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  disabled={contentType === 'generatedMedia' && !selectedMedia.isPaid}
                >
                  <Download size={16} />
                  <span>
                    {contentType === 'generatedMedia' && !selectedMedia.isPaid
                      ? 'Purchase to Download'
                      : 'Download'}
                  </span>
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
