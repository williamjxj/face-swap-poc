'use client'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Loading from '@/components/Loading'
import VideoPlayerWithLoading from '@/components/VideoPlayerWithLoading'
import MediaSkeleton from '@/components/MediaSkeleton'
import VideoItemSkeleton from '@/components/VideoItemSkeleton'
import { getStorageUrl } from '@/utils/storage-helper'
import {
  Download,
  Play,
  Eye,
  Lock,
  ChevronDown,
  Grid3X3,
  List,
  Filter,
  Calendar,
  Search,
  SortAsc,
  SortDesc,
  Star,
  TrendingUp,
  X,
  ShoppingCart,
  Info,
  Menu,
  ChevronLeft,
  User,
  Settings,
  Sliders,
} from 'lucide-react'
import CloseButton from '@/components/CloseButton'
import VideoDetailsModal from '@/components/VideoDetailsModal'
import PaymentModal from '@/components/PaymentModal'
import { PRICING_CONFIG } from '@/config/pricing'
import { useToast } from '@/contexts/ToastContext'

export default function GalleryPage() {
  const [mediaItems, setMediaItems] = useState([])
  const [targetTemplates, setTargetTemplates] = useState([])
  const [faceSources, setFaceSources] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('video')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [contentType, setContentType] = useState('generatedMedia')
  const [contentTypeDropdownOpen, setContentTypeDropdownOpen] = useState(false)

  // New state for enhanced features
  const [viewMode, setViewMode] = useState('masonry') // 'masonry' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'name', 'downloads', 'popularity'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
  const [paymentFilter, setPaymentFilter] = useState('all') // 'all', 'paid', 'preview'
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'week', 'month', 'year'
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [videoDurations, setVideoDurations] = useState({}) // Store video durations
  const [videoLoadingStates, setVideoLoadingStates] = useState({}) // Track individual video loading states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Sidebar toggle state
  const [showCalendar, setShowCalendar] = useState(false) // Calendar dropdown state
  const [selectedDate, setSelectedDate] = useState(null) // Selected custom date
  const [showVideoDetails, setShowVideoDetails] = useState(false) // Video details modal state
  const [selectedVideoDetails, setSelectedVideoDetails] = useState(null) // Selected video for details
  const [showPaymentModal, setShowPaymentModal] = useState(false) // Payment modal state
  const [selectedMediaForPurchase, setSelectedMediaForPurchase] = useState(null) // Selected media for purchase

  // Content type options
  const contentTypes = [
    { id: 'generatedMedia', label: 'Generated Media' },
    { id: 'targetTemplates', label: 'Target Templates' },
    { id: 'faceSources', label: 'Face Sources' },
  ]

  // Define tabs for sidebar with icons
  const tabs = [
    { id: 'video', label: 'Video', icon: Play },
    { id: 'image', label: 'Image', icon: Eye },
    { id: 'gif', label: 'GIF', icon: Star },
    { id: 'multi-face', label: 'Multi-face', icon: User },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date', label: 'Date Created', icon: Calendar },
    { id: 'name', label: 'Name', icon: SortAsc },
    { id: 'downloads', label: 'Downloads', icon: TrendingUp },
    { id: 'popularity', label: 'Popularity', icon: Star },
  ]

  // Payment filter options
  const paymentFilterOptions = [
    { id: 'all', label: 'All Items' },
    { id: 'paid', label: 'Paid Only' },
    { id: 'preview', label: 'Preview Only' },
  ]

  // Date filter options
  const dateFilterOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ]

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

  // Fetch media items from the API based on content type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (contentType === 'generatedMedia') {
          const response = await fetch('/api/generated-media')
          if (!response.ok) throw new Error('Failed to fetch generated media')
          const data = await response.json()
          const files = data.files || []
          setMediaItems(files)

          // Initialize loading states for video items
          const videoLoadingStates = {}
          files.forEach(item => {
            if (getMediaType(item) === 'video') {
              videoLoadingStates[item.id] = true
            }
          })
          setVideoLoadingStates(videoLoadingStates)
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
        toast.error(`Failed to load content: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [contentType, toast])

  // Handle payment success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('paymentSuccess')

    if (paymentSuccess) {
      // Show success message
      toast.success('Payment successful! You can now download your content.')

      // Update the specific media item to mark as paid
      setMediaItems(prev =>
        prev.map(item => (item.id === paymentSuccess ? { ...item, isPaid: true } : item))
      )

      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [toast])

  // Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedItems = useMemo(() => {
    let items = []

    // Get base items by content type
    if (contentType === 'generatedMedia') {
      items = mediaItems
    } else if (contentType === 'targetTemplates') {
      items = targetTemplates
    } else if (contentType === 'faceSources') {
      items = faceSources
    }

    // Filter by media type (tab)
    if (contentType !== 'faceSources') {
      items = items.filter(item => {
        const mediaType = getMediaType(item)
        if (activeTab === 'video') return mediaType === 'video'
        if (activeTab === 'image') return mediaType === 'image'
        if (activeTab === 'gif') return mediaType === 'gif'
        if (activeTab === 'multi-face')
          return item.type === 'multi-face' || item.description === 'multi-face'
        return false
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        item =>
          (item.name || item.filename || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
      )
    }

    // Filter by payment status (only for generated media)
    if (contentType === 'generatedMedia' && paymentFilter !== 'all') {
      items = items.filter(item => {
        if (paymentFilter === 'paid') return item.isPaid
        if (paymentFilter === 'preview') return !item.isPaid
        return true
      })
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      items = items.filter(item => {
        const itemDate = new Date(item.createdAt)

        switch (dateFilter) {
          case 'today':
            return itemDate >= today
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return itemDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
            return itemDate >= monthAgo
          case 'year':
            const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
            return itemDate >= yearAgo
          case 'custom':
            if (selectedDate) {
              const customDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
              )
              return itemDate >= customDate
            }
            return true
          default:
            return true
        }
      })
    }

    // Sort items
    items.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.filename || '').toLowerCase()
          bValue = (b.name || b.filename || '').toLowerCase()
          break
        case 'downloads':
          aValue = a.downloadCount || 0
          bValue = b.downloadCount || 0
          break
        case 'popularity':
          // Calculate popularity score based on downloads and usage
          aValue = (a.downloadCount || 0) + (a.usageCount || 0) * 2
          bValue = (b.downloadCount || 0) + (b.usageCount || 0) * 2
          break
        case 'date':
        default:
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return items
  }, [
    mediaItems,
    targetTemplates,
    faceSources,
    contentType,
    activeTab,
    searchQuery,
    paymentFilter,
    dateFilter,
    selectedDate,
    sortBy,
    sortOrder,
  ])

  // Handle media selection and track views
  const handleMediaClick = media => {
    // Track view count
    if (contentType === 'generatedMedia') {
      setMediaItems(prev =>
        prev.map(item =>
          item.id === media.id ? { ...item, viewCount: (item.viewCount || 0) + 1 } : item
        )
      )
    } else if (contentType === 'targetTemplates') {
      setTargetTemplates(prev =>
        prev.map(item =>
          item.id === media.id ? { ...item, viewCount: (item.viewCount || 0) + 1 } : item
        )
      )
    } else if (contentType === 'faceSources') {
      setFaceSources(prev =>
        prev.map(item =>
          item.id === media.id ? { ...item, viewCount: (item.viewCount || 0) + 1 } : item
        )
      )
    }

    const mediaType = getMediaType(media)
    if (mediaType === 'video') {
      // Open video modal for videos (reverting carousel)
      setSelectedMedia(media)
    } else {
      // For images and other media, use the old behavior
      setSelectedMedia(media)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setPaymentFilter('all')
    setDateFilter('all')
    setSortBy('date')
    setSortOrder('desc')
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (searchQuery.trim()) count++
    if (paymentFilter !== 'all') count++
    if (dateFilter !== 'all') count++
    if (sortBy !== 'date' || sortOrder !== 'desc') count++
    return count
  }

  // Format video duration
  const formatDuration = seconds => {
    if (!seconds || seconds === 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle video loading start
  const handleVideoLoadStart = itemId => {
    setVideoLoadingStates(prev => ({
      ...prev,
      [itemId]: true,
    }))
  }

  // Handle video metadata loading
  const handleVideoLoadedMetadata = (videoElement, itemId) => {
    if (videoElement && videoElement.duration) {
      setVideoDurations(prev => ({
        ...prev,
        [itemId]: videoElement.duration,
      }))
    }
    // Mark video as loaded
    setVideoLoadingStates(prev => ({
      ...prev,
      [itemId]: false,
    }))
  }

  // Handle video can play
  const handleVideoCanPlay = itemId => {
    setVideoLoadingStates(prev => ({
      ...prev,
      [itemId]: false,
    }))
  }

  // Get video duration for display
  const getVideoDuration = item => {
    // First check if we have stored duration
    if (videoDurations[item.id]) {
      return formatDuration(videoDurations[item.id])
    }
    // Then check if item has duration property
    if (item.duration) {
      return formatDuration(item.duration)
    }
    // Default fallback
    return '00:00'
  }

  // Handle media download
  const handleDownload = async (media, e) => {
    if (e) e.stopPropagation()

    if (contentType === 'generatedMedia' && !media.isPaid) {
      toast.warning('Please purchase this media to download')
      return
    }

    try {
      if (contentType === 'generatedMedia') {
        // Use the download API for generated media
        const filename = media.name || media.filename
        if (!filename) {
          throw new Error('Media filename not available')
        }

        // console.log('Attempting to download media:', filename)
        const endpoint = `/api/download-media?filename=${encodeURIComponent(filename)}`
        const response = await fetch(endpoint)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Download API error:', errorText)
          throw new Error(`Failed to download media: ${response.status} ${response.statusText}`)
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
      } else {
        // For templates and face sources, use the download APIs
        const filename = media.filename || media.name
        if (!filename) {
          throw new Error(
            `${contentType === 'targetTemplates' ? 'Template' : 'Face source'} filename not available`
          )
        }

        // console.log(`Attempting to download ${contentType}:`, filename)
        const endpoint =
          contentType === 'targetTemplates'
            ? `/api/download-template?filename=${encodeURIComponent(filename)}`
            : `/api/download-source?filename=${encodeURIComponent(filename)}`

        const response = await fetch(endpoint)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Download API error:', errorText)
          throw new Error(
            `Failed to download ${contentType === 'targetTemplates' ? 'template' : 'face source'}: ${response.status} ${response.statusText}`
          )
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(`Error downloading ${contentType}:`, err)
      toast.error(`Download failed: ${err.message}`)
    }
  }

  // Handle purchase action
  const handlePurchase = async (media, e) => {
    if (e) e.stopPropagation()

    if (contentType !== 'generatedMedia') {
      toast.warning('Purchase is only available for generated media')
      return
    }

    try {
      console.log('Opening payment modal for:', media.name)

      // Open payment modal with selected media
      setSelectedMediaForPurchase(media)
      setShowPaymentModal(true)

      // Close video details modal if open
      setShowVideoDetails(false)
    } catch (error) {
      console.error('Purchase failed:', error)
      toast.error('Failed to open payment options. Please try again.')
    }
  }

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setSelectedMediaForPurchase(null)
  }

  // Handle showing video details
  const handleShowVideoDetails = (media, e) => {
    if (e) e.stopPropagation()
    setSelectedVideoDetails(media)
    setShowVideoDetails(true)
  }

  // Handle closing video details modal
  const handleCloseVideoDetails = () => {
    setShowVideoDetails(false)
    setSelectedVideoDetails(null)
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

  // Get the page title icon based on content type and active tab
  const getPageTitleIcon = () => {
    if (contentType === 'generatedMedia') {
      if (activeTab === 'video') return Play
      if (activeTab === 'image') return Eye
      if (activeTab === 'gif') return Star
      if (activeTab === 'multi-face') return User
    } else if (contentType === 'targetTemplates') {
      if (activeTab === 'video') return Play
      if (activeTab === 'image') return Eye
      if (activeTab === 'gif') return Star
      if (activeTab === 'multi-face') return User
    } else if (contentType === 'faceSources') {
      return User
    }
    return Grid3X3
  }

  return (
    <div className="flex-grow flex h-[calc(100vh-80px)]">
      {/* Enhanced Left sidebar with filters - Toggleable */}
      <div
        className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-[#1a1d24] border-r border-gray-800 lg:block hidden transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 h-full overflow-y-auto">
          {/* Sidebar Header with Toggle */}
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Grid3X3 size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-white">Gallery</h2>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="group p-2 rounded-lg bg-[#2a2d34] hover:bg-[#3a3d44] text-gray-400 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? (
                <Menu
                  size={18}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              ) : (
                <ChevronLeft
                  size={18}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              )}
            </button>
          </div>

          {/* Sidebar Content - Hidden when collapsed */}
          {!sidebarCollapsed && (
            <>
              {/* Content Type Dropdown */}
              <div className="mb-6 relative">
                <button
                  onClick={toggleContentTypeDropdown}
                  className="w-full px-4 py-3 bg-[#2a2d34] rounded-lg text-white font-medium flex justify-between items-center hover:bg-[#3a3d44] transition-colors"
                >
                  <span>{getCurrentContentTypeLabel()}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${contentTypeDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {contentTypeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-[#2a2d34] rounded-lg shadow-lg overflow-hidden border border-gray-700">
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

              {/* Enhanced Search Bar */}
              <div className="mb-6">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-2">
                  <Search size={14} />
                  <span>Search Media</span>
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#2a2d34] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-600"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Media Type Tabs */}
              {(contentType === 'generatedMedia' || contentType === 'targetTemplates') && (
                <div className="mb-6">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-3">
                    <Sliders size={14} />
                    <span>Media Type</span>
                  </label>
                  <div className="flex flex-col space-y-2">
                    {tabs.map(tab => {
                      const IconComponent = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                        px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-left flex items-center space-x-3 group
                        ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:bg-[#2a2d34] hover:text-white'
                        }
                      `}
                        >
                          <IconComponent
                            size={16}
                            className="group-hover:scale-110 transition-transform duration-200"
                          />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Enhanced Payment Filter (only for generated media) */}
              {contentType === 'generatedMedia' && (
                <div className="mb-6">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-3">
                    <ShoppingCart size={14} />
                    <span>Payment Status</span>
                  </label>
                  <div className="flex flex-col space-y-2">
                    {paymentFilterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setPaymentFilter(option.id)}
                        className={`
                      px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left
                      ${
                        paymentFilter === option.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-[#2a2d34] hover:text-white'
                      }
                    `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Date Filter */}
              <div className="mb-6">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-3">
                  <Calendar size={14} />
                  <span>Date Range</span>
                </label>
                <div className="flex flex-col space-y-2">
                  {dateFilterOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setDateFilter(option.id)}
                      className={`
                    px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left
                    ${
                      dateFilter === option.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-[#2a2d34] hover:text-white'
                    }
                  `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Sort Options */}
              <div className="mb-6">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-3">
                  <Settings size={14} />
                  <span>Sort By</span>
                </label>
                <div className="flex flex-col space-y-2">
                  {sortOptions.map(option => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`
                      px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left flex items-center space-x-2
                      ${
                        sortBy === option.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-[#2a2d34] hover:text-white'
                      }
                    `}
                      >
                        <IconComponent size={16} />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Sort Order Toggle */}
                <button
                  onClick={toggleSortOrder}
                  className="w-full mt-2 px-4 py-2 bg-[#2a2d34] rounded-lg text-gray-300 hover:bg-[#3a3d44] hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                  {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>

              {/* Clear Filters */}
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <X size={16} />
                  <span>Clear Filters ({getActiveFilterCount()})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d24] border-t border-gray-800 z-30">
        <div className="flex justify-between px-2">
          {/* Content Type Dropdown for Mobile */}
          <button
            onClick={toggleContentTypeDropdown}
            className="flex-1 py-3 text-xs font-medium text-center transition-colors cursor-pointer text-blue-500 border-t-2 border-blue-500"
          >
            {getCurrentContentTypeLabel()}
          </button>

          {/* Filter Button for Mobile */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors cursor-pointer flex items-center justify-center space-x-1 ${
              showMobileFilters ? 'text-blue-500 border-t-2 border-blue-500' : 'text-gray-400'
            }`}
          >
            <Filter size={14} />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>

          {/* Only show tabs for Generated Media and Target Templates on mobile */}
          {(contentType === 'generatedMedia' || contentType === 'targetTemplates') &&
            tabs.slice(0, 2).map(tab => (
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

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="absolute bottom-16 left-0 right-0 bg-[#1a1d24] border-t border-gray-800 z-20 max-h-96 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a2d34] border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm"
                />
              </div>

              {/* Mobile Payment Filter */}
              {contentType === 'generatedMedia' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Status</h4>
                  <div className="flex space-x-2">
                    {paymentFilterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setPaymentFilter(option.id)}
                        className={`px-3 py-1 rounded text-xs ${
                          paymentFilter === option.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2d34] text-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Sort */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Sort By</h4>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`px-3 py-1 rounded text-xs ${
                        sortBy === option.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2d34] text-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Main content area */}
      <div className="flex-1 surface-primary overflow-y-auto pb-16 lg:pb-6 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loading />
            <p className="text-secondary mt-4 text-body">Loading your media...</p>
          </div>
        ) : (
          <>
            {/* Enhanced Header with horizontal filters */}
            <div className="sticky top-0 surface-primary z-10 p-4 md:p-6 border-b border-primary backdrop-blur-sm bg-opacity-95">
              {/* Title and View Controls Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const IconComponent = getPageTitleIcon()
                      return <IconComponent size={24} className="text-blue-500" />
                    })()}
                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      {getPageTitle()}
                    </h1>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {filteredAndSortedItems.length}{' '}
                    {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                    {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()} filters active)`}
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <div className="flex bg-[#2a2d34] rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('masonry')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'masonry'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Masonry View"
                    >
                      <Grid3X3 size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`lg:hidden p-2 rounded-lg transition-colors relative ${
                      showFilters
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2d34] text-gray-400 hover:text-white'
                    }`}
                    title="Toggle Filters"
                  >
                    <Filter size={18} />
                    {getActiveFilterCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Horizontal Filters Row - Desktop */}
              <div className="hidden lg:flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative min-w-64">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#2a2d34] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Payment Filter (only for generated media) */}
                {contentType === 'generatedMedia' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Status:</span>
                    <div className="flex bg-[#2a2d34] rounded-lg p-1">
                      {paymentFilterOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setPaymentFilter(option.id)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            paymentFilter === option.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Filter with Calendar */}
                <div className="flex items-center space-x-2 relative">
                  <span className="text-sm text-gray-400">Date:</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="bg-[#2a2d34] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 hover:bg-[#3a3d44] transition-colors flex items-center space-x-2"
                    >
                      <Calendar size={14} />
                      <span>
                        {dateFilter === 'custom' && selectedDate
                          ? selectedDate.toLocaleDateString()
                          : dateFilterOptions.find(opt => opt.id === dateFilter)?.label ||
                            'All Time'}
                      </span>
                    </button>

                    {/* Calendar Dropdown */}
                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-1 bg-[#2a2d34] border border-gray-600 rounded-lg shadow-lg z-50 p-3 min-w-64">
                        {/* Quick Date Options */}
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">Quick Select</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {dateFilterOptions.map(option => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setDateFilter(option.id)
                                  setSelectedDate(null)
                                  setShowCalendar(false)
                                }}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  dateFilter === option.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-[#3a3d44] hover:text-white'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Date Input */}
                        <div className="border-t border-gray-600 pt-3">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">Custom Date</h4>
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                              onChange={e => {
                                const date = new Date(e.target.value)
                                setSelectedDate(date)
                                setDateFilter('custom')
                              }}
                              className="w-full bg-[#1a1d24] border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                            {selectedDate && (
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-400">
                                  From {selectedDate.toLocaleDateString()} onwards
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedDate(null)
                                    setDateFilter('all')
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Close Button */}
                        <button
                          onClick={() => setShowCalendar(false)}
                          className="w-full mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-[#2a2d34] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={toggleSortOrder}
                    className="p-2 bg-[#2a2d34] rounded-lg text-gray-400 hover:text-white transition-colors"
                    title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </button>
                </div>

                {/* Clear Filters */}
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                  >
                    <X size={14} />
                    <span>Clear ({getActiveFilterCount()})</span>
                  </button>
                )}
              </div>

              {/* Mobile Filters Panel */}
              {showFilters && (
                <div className="lg:hidden mt-4 p-4 bg-[#1a1d24] rounded-lg border border-gray-700">
                  <div className="space-y-4">
                    {/* Mobile Search */}
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search media..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#2a2d34] border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm"
                      />
                    </div>

                    {/* Mobile Payment Filter */}
                    {contentType === 'generatedMedia' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Status</h4>
                        <div className="flex space-x-2">
                          {paymentFilterOptions.map(option => (
                            <button
                              key={option.id}
                              onClick={() => setPaymentFilter(option.id)}
                              className={`px-3 py-1 rounded text-xs ${
                                paymentFilter === option.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-[#2a2d34] text-gray-400'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile Sort and Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Date Range</h4>
                        <select
                          value={dateFilter}
                          onChange={e => setDateFilter(e.target.value)}
                          className="w-full bg-[#2a2d34] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          {dateFilterOptions.map(option => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Sort By</h4>
                        <div className="flex space-x-1">
                          <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="flex-1 bg-[#2a2d34] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            {sortOptions.map(option => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={toggleSortOrder}
                            className="p-2 bg-[#2a2d34] rounded-lg text-gray-400 hover:text-white"
                          >
                            {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {getActiveFilterCount() > 0 && (
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {loading ? (
                <MediaSkeleton count={10} viewMode={viewMode} className="animate-shimmer" />
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
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
                    {getActiveFilterCount() > 0
                      ? 'No items match your current filters. Try adjusting your search criteria.'
                      : contentType === 'generatedMedia'
                        ? 'Create some amazing content in Face Swap Generator to see it here.'
                        : contentType === 'targetTemplates'
                          ? 'Upload target templates to see them here.'
                          : 'Upload face sources to see them here.'}
                  </p>
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : viewMode === 'masonry' ? (
                /* Masonry View */
                <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-6 space-y-3 md:space-y-6">
                  {filteredAndSortedItems.map(item => (
                    <div
                      key={item.id}
                      className="break-inside-avoid group relative card-elevated rounded-xl overflow-hidden cursor-pointer hover:transform hover:scale-[1.02] transition-all duration-200"
                      onClick={() => handleMediaClick(item)}
                    >
                      <div className="relative">
                        {getMediaType(item) === 'video' ? (
                          <>
                            {/* Show skeleton while video is loading */}
                            {videoLoadingStates[item.id] && (
                              <div className="absolute inset-0 z-20">
                                <VideoItemSkeleton />
                              </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <Play className="w-8 h-8 md:w-12 md:h-12 text-white opacity-70 group-hover:opacity-90 transition-opacity" />
                            </div>
                            <video
                              src={getStorageUrl(
                                contentType === 'generatedMedia' && !item.isPaid
                                  ? item.watermarkPath || item.filePath
                                  : item.filePath
                              )}
                              className="w-full h-auto object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              onLoadStart={() => handleVideoLoadStart(item.id)}
                              onLoadedMetadata={e => handleVideoLoadedMetadata(e.target, item.id)}
                              onCanPlay={() => handleVideoCanPlay(item.id)}
                              onError={e => {
                                const video = e.target
                                const error = video.error
                                console.error('Video loading error:', {
                                  src: video.src,
                                  error: error
                                    ? {
                                        code: error.code,
                                        message: error.message,
                                        MEDIA_ERR_ABORTED: error.code === 1,
                                        MEDIA_ERR_NETWORK: error.code === 2,
                                        MEDIA_ERR_DECODE: error.code === 3,
                                        MEDIA_ERR_SRC_NOT_SUPPORTED: error.code === 4,
                                      }
                                    : 'No error details available',
                                })
                                const fallbackDiv = document.createElement('div')
                                fallbackDiv.className =
                                  'w-full h-48 flex items-center justify-center bg-[#2a2d34]'
                                fallbackDiv.innerHTML =
                                  '<svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                                e.target.parentNode.appendChild(fallbackDiv)
                                e.target.style.display = 'none'
                              }}
                            />
                            {/* Video Duration Badge - Always visible on top-left */}
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium z-30 pointer-events-none">
                              {getVideoDuration(item)}
                            </div>
                            {contentType === 'generatedMedia' && !item.isPaid && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                                <Lock className="w-6 h-6 md:w-8 md:h-8 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <Image
                            src={
                              item.thumbnailPath
                                ? getStorageUrl(item.thumbnailPath)
                                : item.filePath && !item.filePath.match(/\.(mp4|webm|mov|avi)$/i)
                                  ? getStorageUrl(item.filePath)
                                  : '/placeholder-thumbnail.svg'
                            }
                            alt={item.name || item.filename || 'Media item'}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover"
                            priority={false}
                          />
                        )}

                        {/* Download/Purchase Icon - Top Right */}
                        <div className="absolute top-2 right-2 z-30">
                          {contentType === 'generatedMedia' && !item.isPaid ? (
                            <button
                              onClick={e => handlePurchase(item, e)}
                              className="group p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm cursor-pointer"
                              title={`Purchase for ${PRICING_CONFIG.getFormattedPrice()}`}
                            >
                              <ShoppingCart
                                size={16}
                                className="group-hover:scale-110 transition-transform duration-200"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={e => handleDownload(item, e)}
                              className="group p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm cursor-pointer"
                              title="Download"
                            >
                              <Download
                                size={16}
                                className="group-hover:scale-110 transition-transform duration-200"
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                        <div className="p-3 w-full">
                          <div className="text-white font-medium truncate text-sm mb-2">
                            {item.name || item.filename || 'Untitled'}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center space-x-3">
                              {(contentType === 'generatedMedia' ||
                                contentType === 'targetTemplates' ||
                                contentType === 'faceSources') && (
                                <div className="flex items-center">
                                  <Eye size={12} className="mr-1" />
                                  <span>{item.viewCount || 0}</span>
                                </div>
                              )}
                              <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                            </div>

                            {/* Info Icon - Bottom Right */}
                            <button
                              onClick={e => handleShowVideoDetails(item, e)}
                              className="group p-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
                              title="View Details"
                            >
                              <Info
                                size={14}
                                className="group-hover:scale-110 transition-transform duration-200"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {filteredAndSortedItems.map(item => (
                    <div
                      key={item.id}
                      className="group card-elevated rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                      onClick={() => handleMediaClick(item)}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail */}
                        <div className="relative w-full sm:w-48 h-48 sm:h-32 flex-shrink-0">
                          {getMediaType(item) === 'video' ? (
                            <>
                              {/* Show skeleton while video is loading */}
                              {videoLoadingStates[item.id] && (
                                <div className="absolute inset-0 z-20">
                                  <VideoItemSkeleton aspectRatio="16/9" />
                                </div>
                              )}

                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Play className="w-8 h-8 text-white opacity-70 group-hover:opacity-90 transition-opacity" />
                              </div>
                              <video
                                src={getStorageUrl(
                                  contentType === 'generatedMedia' && !item.isPaid
                                    ? item.watermarkPath || item.filePath
                                    : item.filePath
                                )}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                onLoadStart={() => handleVideoLoadStart(item.id)}
                                onLoadedMetadata={e => handleVideoLoadedMetadata(e.target, item.id)}
                                onCanPlay={() => handleVideoCanPlay(item.id)}
                              />
                              {/* Video Duration Badge - Always visible on top-left */}
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium z-30 pointer-events-none">
                                {getVideoDuration(item)}
                              </div>
                              {contentType === 'generatedMedia' && !item.isPaid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                                  <Lock className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </>
                          ) : (
                            <Image
                              src={
                                item.thumbnailPath
                                  ? getStorageUrl(item.thumbnailPath)
                                  : item.filePath && !item.filePath.match(/\.(mp4|webm|mov|avi)$/i)
                                    ? getStorageUrl(item.filePath)
                                    : '/placeholder-thumbnail.svg'
                              }
                              alt={item.name || item.filename || 'Media item'}
                              fill
                              className="object-cover"
                              priority={false}
                            />
                          )}

                          {/* Download/Purchase Icon - Top Right */}
                          <div className="absolute top-2 right-2 z-30">
                            {contentType === 'generatedMedia' && !item.isPaid ? (
                              <button
                                onClick={e => handlePurchase(item, e)}
                                className="group p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm cursor-pointer"
                                title={`Purchase for ${PRICING_CONFIG.getFormattedPrice()}`}
                              >
                                <ShoppingCart
                                  size={16}
                                  className="group-hover:scale-110 transition-transform duration-200"
                                />
                              </button>
                            ) : (
                              <button
                                onClick={e => handleDownload(item, e)}
                                className="group p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm cursor-pointer"
                                title="Download"
                              >
                                <Download
                                  size={16}
                                  className="group-hover:scale-110 transition-transform duration-200"
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                              {item.name || item.filename || 'Untitled'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              {(contentType === 'generatedMedia' ||
                                contentType === 'targetTemplates' ||
                                contentType === 'faceSources') && (
                                <div className="flex items-center">
                                  <Eye size={14} className="mr-1" />
                                  <span>{item.viewCount || 0} views</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <span className="capitalize">{getMediaType(item)}</span>
                              </div>
                              {contentType === 'generatedMedia' && (
                                <div
                                  className={`px-2 py-1 rounded text-xs ${
                                    item.isPaid
                                      ? 'bg-green-600 text-white'
                                      : 'bg-yellow-600 text-black'
                                  }`}
                                >
                                  {item.isPaid ? 'Paid' : 'Preview'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {item.description && (
                                <p className="truncate max-w-md">{item.description}</p>
                              )}
                            </div>
                            <button
                              onClick={e => handleShowVideoDetails(item, e)}
                              className="group px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="View Details"
                            >
                              <Info
                                size={16}
                                className="group-hover:scale-110 transition-transform duration-200"
                              />
                              <span className="hidden sm:inline">Details</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Media preview modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
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
                  src={getStorageUrl(selectedMedia.filePath)}
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
                      getMediaType(selectedMedia) === 'gif' ||
                      (getMediaType(selectedMedia) === 'unknown' &&
                        selectedMedia.mimeType?.startsWith('image/')) ||
                      selectedMedia.mimeType?.startsWith('image/')) ? (
                      <Image
                        src={getStorageUrl(selectedMedia.filePath) || '/placeholder-thumbnail.svg'}
                        alt={selectedMedia.name || selectedMedia.filename || 'Media item'}
                        width={800}
                        height={800}
                        className="max-h-[70vh] object-contain"
                        priority={true}
                        onError={e => {
                          // Handle image load errors gracefully
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
                {contentType === 'generatedMedia' && !selectedMedia.isPaid ? (
                  <button
                    onClick={e => handlePurchase(selectedMedia, e)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white flex items-center space-x-2 transition-all duration-200"
                  >
                    <ShoppingCart size={16} />
                    <span>Purchase to Download</span>
                  </button>
                ) : (
                  <button
                    onClick={e => handleDownload(selectedMedia, e)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 transition-all duration-200"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-400">
                Created:{' '}
                {(() => {
                  try {
                    const date = selectedMedia.createdAt || selectedMedia.uploadedAt
                    if (!date) return 'Unknown'
                    const parsedDate = new Date(date)
                    if (isNaN(parsedDate.getTime())) return 'Invalid Date'
                    return parsedDate.toLocaleString()
                  } catch {
                    return 'Invalid Date'
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Details Modal */}
      <VideoDetailsModal
        video={selectedVideoDetails}
        isOpen={showVideoDetails}
        onClose={handleCloseVideoDetails}
        onDownload={video => handleDownload(video)}
        onPurchase={video => handlePurchase(video)}
      />

      {/* Payment Modal */}
      <PaymentModal
        media={selectedMediaForPurchase}
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
      />
    </div>
  )
}
