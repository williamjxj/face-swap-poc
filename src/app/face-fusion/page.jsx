'use client'

import Image from 'next/image'
import { Info, ArrowLeftRight, Download, Lock, ShoppingCart, ExternalLink } from 'lucide-react'
import { getStorageUrl } from '@/utils/storage-helper'
import FaceSelection from './FaceSelection'
import { useState, useEffect } from 'react'
import VideoModal from '@/components/VideoModal'
import GuidelineModal from '@/components/GuidelineModal'
import Loading from '@/components/Loading'
import TabContent from './TabContent'
import CloseButton from '@/components/CloseButton'
import VideoPlayerWithLoading from '@/components/VideoPlayerWithLoading'
import { MdFace } from 'react-icons/md'
import { PRICING_CONFIG } from '@/config/pricing'
import PaymentModal from '@/components/PaymentModal'

// Constants
const FILE_SIZE_LIMITS = {
  VIDEO: 150 * 1024 * 1024, // 150MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  GIF: 50 * 1024 * 1024, // 50MB
}

export default function FaceFusion() {
  // State declarations
  const [selectedTab, setSelectedTab] = useState('video')
  const [rightSideTab, setRightSideTab] = useState('face-swap')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentSuccessId, setPaymentSuccessId] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMediaForPurchase, setSelectedMediaForPurchase] = useState(null)
  const [targetPath, setTargetPath] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [imageSources, setImageSources] = useState([])
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedFace, setSelectedFace] = useState(null)
  const [videoUploadLoading, setVideoUploadLoading] = useState(false)
  const [imageUploadLoading, setImageUploadLoading] = useState(false)
  const [gifUploadLoading, setGifUploadLoading] = useState(false)
  const [multiFaceUploadLoading, setMultiFaceUploadLoading] = useState(false)

  // Constants
  const tabOptions = [
    { id: 'video', label: 'Video' },
    { id: 'image', label: 'Image' },
    { id: 'gif', label: 'GIF' },
    { id: 'multi-face', label: 'Multi-face' },
  ]

  // Effects
  useEffect(() => {
    if (rightSideTab === 'history') {
      setIsLoading(true)
      fetchVideos()
    } else {
      setIsLoading(false)
      setGeneratedVideos([])
    }
  }, [rightSideTab])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tab = searchParams.get('tab')
    const paymentSuccess = searchParams.get('paymentSuccess')

    if (tab === 'history') {
      setRightSideTab('history')
    }

    if (paymentSuccess) {
      setPaymentSuccessId(paymentSuccess)

      const refreshVideos = async () => {
        try {
          const response = await fetch('/api/generated-media')
          if (response.ok) {
            const data = await response.json()
            if (data.files) {
              const videos = data.files.map(video => ({
                ...video,
                fileSize: BigInt(video.fileSize || 0),
              }))
              setGeneratedVideos(videos)
            }
          }
        } catch (error) {
          // Silently handle refresh errors
        }
      }

      refreshVideos()

      setTimeout(() => {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('paymentSuccess')
        window.history.replaceState({}, '', newUrl)

        setTimeout(() => {
          setPaymentSuccessId(null)
          refreshVideos()
        }, 3000)
      }, 2000)
    }
  }, [])

  // Load templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true)
        const response = await fetch('/api/templates')
        if (!response.ok) {
          throw new Error('Failed to load templates')
        }
        const data = await response.json()
        setTemplates(data.templates)
        // Do not auto-select first template on initial load
        // Template will be selected when user clicks on it
      } catch (error) {
        setError('Failed to load templates')
      } finally {
        setTemplatesLoading(false)
      }
    }

    loadTemplates()
  }, [])
  useEffect(() => {
    const loadGeneratedVideos = async () => {
      try {
        const response = await fetch('/api/generated-media')
        if (!response.ok) {
          throw new Error('Failed to load generated videos')
        }
        const data = await response.json()

        if (data.files) {
          // Convert strings back to BigInt if needed
          const videos = data.files.map(video => ({
            ...video,
            fileSize: BigInt(video.fileSize || 0), // Convert back to BigInt
          }))
          setGeneratedVideos(videos)
        }
      } catch (error) {
        setError('Failed to load generated videos')
      }
    }

    loadGeneratedVideos()
  }, [result]) // Reload when new video is generated

  // Load image sources from API
  useEffect(() => {
    const loadImageSources = async () => {
      try {
        const response = await fetch('/api/face-sources')
        const data = await response.json()

        if (data.files) {
          const sources = data.files
            .map(file => ({
              id: file.id,
              name: file.filename,
              imagePath: file.filePath, // This should match what FaceSelection expects
              filePath: file.filePath, // Keep both for compatibility
              createdAt: file.createdAt || 0,
            }))
            .sort((a, b) => b.createdAt - a.createdAt) // Sort by creation time descending
          setImageSources(sources)
        }
      } catch (error) {
        setError('Failed to load image sources')
      }
    }

    loadImageSources()
  }, [])

  const handleSourceUpload = async e => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setProcessing(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload-source', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()

        // Create new image object with proper Supabase storage path
        const newImage = {
          id: data.id,
          name: data.filename,
          imagePath: data.filePath, // Use the Supabase storage path
          filePath: data.filePath,
          createdAt: Date.now(),
        }

        // Update selected source with proper preview URL
        const newSource = {
          preview: data.filePath, // Use storage path for preview (will be converted to URL in UI)
          name: data.filename,
          id: data.id,
        }
        setSelectedSource(newSource)
        setSourcePath(data.filePath) // Use storage path

        // Add the new image to the beginning of imageSources
        setImageSources(prev => [newImage, ...prev])
      } catch (error) {
        setError('Failed to upload image')
      } finally {
        setProcessing(false)
      }
    }
  }

  const handleSourceSelect = image => {
    setSelectedSource({
      preview: image.imagePath, // This is the storage path (will be converted to URL in UI)
      name: image.name,
    })
    setSourcePath(image.imagePath) // Use storage path for processing
  }

  const handleSubmit = async () => {
    if (!sourcePath || !targetPath) {
      return
    }

    setProcessing(true)
    setProgress(0) // Reset progress
    setError(null)
    setResult(null)

    try {
      // Set up progress simulation with more realistic progression
      const progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // Progressive increments with slower growth as we approach 90%
          // This gives a more realistic feeling of progress
          const increment = Math.max(0.5, (95 - prevProgress) / 10)
          return Math.min(prevProgress + increment, 95)
        })
      }, 300)

      // Submit form data
      const response = await fetch('/api/face-fusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourcePath,
          target: targetPath,
        }),
      })

      clearInterval(progressInterval) // Clean up interval

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Face swap failed: ${error}`)
      }

      // Set progress to 100% when complete
      setProgress(100)

      const generatedVideo = await response.json()
      setResult(generatedVideo)
      setRightSideTab('history') // Switch to history tab after successful generation
    } catch (error) {
      setError(error.message)
      setProgress(0) // Reset progress on error
    } finally {
      setTimeout(() => {
        setProcessing(false)
      }, 500) // Slight delay to show 100% progress
    }
  }

  const handleVideoClick = video => {
    setSelectedVideo(video)
  }

  // Note: Delete functionality is now handled only in the admin area, not in user-facing UI

  // Handle download of video
  const handleDownload = async video => {
    // For demo/POC: Allow downloads without payment requirement
    // In production, you would check: if (!video.isPaid) { ... }
    // if (!video.isPaid) {
    //   setError('Please purchase the video to download')
    //   setSelectedVideo(video)
    //   return
    // }

    try {
      const response = await fetch(`/api/download-media?filename=${video.name}`)
      if (!response.ok) {
        // Check if it's a payment issue
        if (response.status === 403) {
          setError('Please purchase the video to download')
          setSelectedVideo(video) // Open the modal for payment
          return
        }
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

      // Update download count
      try {
        await fetch(`/api/generated-media/${video.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            downloadCount: video.downloadCount ? video.downloadCount + 1 : 1,
          }),
        })
      } catch (err) {
        // Silently handle download count update errors
      }
    } catch (error) {
      setError('Failed to download video')
    }
  }

  // Handle deletion of video
  const handleDelete = video => {
    // Update the UI by removing the video from generatedVideos
    setGeneratedVideos(prev => prev.filter(item => item.id !== video.id))
    // Close the modal
    setSelectedVideo(null)
  }

  const handleSourceDelete = async (image, e) => {
    e.stopPropagation() // Prevent triggering image selection
    try {
      // Check if this is a file-only source (not in database)
      if (image.fileOnly) {
        // Just remove from UI without hitting the API
        setImageSources(sources => sources.filter(src => src.name !== image.name))

        // Clear selection if deleted image was selected
        if (selectedSource?.name === image.name) {
          setSelectedSource(null)
          setSourcePath(null)
        }
        return
      }

      // Normal case - delete from database
      const response = await fetch('/api/face-sources', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: image.name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete face source')
      }

      // Remove from imageSources array
      setImageSources(sources => sources.filter(src => src.name !== image.name))
      // Clear selection if deleted image was selected
      if (selectedSource?.name === image.name) {
        setSelectedSource(null)
        setSourcePath(null)
      }
    } catch (error) {
      setError('Failed to delete source image')
    }
  }

  const handleTemplateSelect = template => {
    setSelectedTemplate(template)
    setSelectedFace(0) // Reset face selection index
    setTargetPath(template.filePath)
  }

  const handleTemplateAndSourceSelect = (template, sourceImage) => {
    // Select the template
    setSelectedTemplate(template)
    setTargetPath(template.filePath)

    // Select the source image if provided
    if (sourceImage) {
      setSelectedSource({
        preview: sourceImage.imagePath,
        name: sourceImage.name,
      })
      setSourcePath(sourceImage.imagePath)
    }
  }

  const handleDeleteTemplate = async templateId => {
    try {
      // Call API to delete template
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      // Update UI by removing the template from state
      setTemplates(prev => prev.filter(template => template.id !== templateId))

      // Clear selection if this was the selected template
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
        setTargetPath(null)
        setSelectedFace(null)
      }
    } catch (error) {
      setError('Failed to delete template')
    }
  }

  // Generic upload helper to reduce code duplication
  const handleTemplateUpload = async (file, templateType, setLoadingState, sizeLimit) => {
    try {
      setLoadingState(true)

      if (file.size > sizeLimit) {
        throw new Error(`File size exceeds ${sizeLimit / 1024 / 1024}MB limit`)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('templateType', templateType)

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Upload failed: ${errorData}`)
      }

      const data = await response.json()

      const newTemplate = {
        id: data.id,
        filename: data.filename,
        type: templateType,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        duration: data.duration,
        fileSize: BigInt(data.fileSize),
        mimeType: data.mimeType,
      }

      // Update state
      setTemplates(prev => [newTemplate, ...prev])
      setSelectedTemplate(newTemplate)
      setSelectedFace(0)
      setTargetPath(newTemplate.filePath)

      return newTemplate
    } catch (error) {
      setError(error.message || `Failed to upload ${templateType}`)
      throw error
    } finally {
      setLoadingState(false)
    }
  }

  const handleTargetUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      await handleTemplateUpload(file, 'video', setVideoUploadLoading, FILE_SIZE_LIMITS.VIDEO)
    }
  }

  const handleImageUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      await handleTemplateUpload(file, 'image', setImageUploadLoading, FILE_SIZE_LIMITS.IMAGE)
    }
  }

  const handleGifUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      await handleTemplateUpload(file, 'gif', setGifUploadLoading, FILE_SIZE_LIMITS.GIF)
    }
  }

  const handleMultiFaceUploadWrapper = async e => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      try {
        // Set loading state
        setMultiFaceUploadLoading(true)

        // Check if any file exceeds 10MB
        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
        if (oversizedFiles.length > 0) {
          setError('Some files exceed 10MB limit')
          setMultiFaceUploadLoading(false)
          return
        }

        // Upload each file
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('templateType', 'multi-face')

          const response = await fetch('/api/upload-template', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`Upload failed: ${errorData}`)
          }

          const data = await response.json()

          // Create a new template object
          const newTemplate = {
            id: data.id,
            filename: data.filename,
            type: 'multi-face',
            filePath: data.filePath,
            thumbnailPath: data.thumbnailPath,
            duration: data.duration,
            fileSize: BigInt(data.fileSize),
            mimeType: data.mimeType,
          }

          // Update templates
          setTemplates(prev => [newTemplate, ...prev])

          // Select the new template
          setSelectedTemplate(newTemplate)
          setSelectedFace(0)
          setTargetPath(newTemplate.filePath) // Ensure target path is updated
        }
      } catch (error) {
        setError(error.message || 'Failed to upload multi-face templates')
      } finally {
        // Reset loading state
        setMultiFaceUploadLoading(false)
      }
    }
  }

  // Helper function to get video duration
  const getVideoDuration = media => {
    if (media.duration) {
      const minutes = Math.floor(media.duration / 60)
      const seconds = Math.floor(media.duration % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return '0:00'
  }

  // Handle purchase action - opens payment modal
  const handlePurchase = async (media, e) => {
    if (e) e.stopPropagation()

    try {
      // Open payment modal with selected media
      setSelectedMediaForPurchase(media)
      setShowPaymentModal(true)
    } catch (error) {
      setError('Purchase failed')
    }
  }

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setSelectedMediaForPurchase(null)
  }

  // Functions
  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/generated-media?limit=20')
      if (!response.ok) {
        throw new Error('Failed to load generated videos')
      }
      const data = await response.json()

      if (data.files) {
        // Convert strings back to BigInt if needed
        const videos = data.files.map(video => ({
          ...video,
          fileSize: BigInt(video.fileSize || 0), // Convert back to BigInt
        }))
        setGeneratedVideos(videos)
      }
    } catch (error) {
      setError('Failed to load videos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-1 sm:gap-2 md:gap-3 lg:gap-4 h-[calc(100vh-4rem)]">
      {/* Left side - Tab navigation */}
      <div className="w-1/4 lg:w-1/4 md:w-1/3 sm:w-2/5 surface-secondary rounded-xl flex flex-col border border-primary shadow-lg">
        {/* Tab Navigation */}
        <div className="p-2 sm:p-3 md:p-4 border-b border-primary">
          <div className="flex space-x-1 sm:space-x-2">
            {tabOptions.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? 'gradient-primary text-white shadow-lg glow-primary'
                    : 'text-tertiary hover:surface-tertiary hover:text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <TabContent
            selectedTab={selectedTab}
            templates={templates}
            onSelectTemplate={handleTemplateSelect}
            onSelectSourceForTemplate={handleTemplateAndSourceSelect}
            selectedTemplate={selectedTemplate}
            onTargetUpload={handleTargetUploadWrapper}
            onImageUpload={handleImageUploadWrapper}
            onGifUpload={handleGifUploadWrapper}
            onMultiFaceUpload={handleMultiFaceUploadWrapper}
            onDeleteTemplate={handleDeleteTemplate}
            videoUploadLoading={videoUploadLoading}
            imageUploadLoading={imageUploadLoading}
            gifUploadLoading={gifUploadLoading}
            multiFaceUploadLoading={multiFaceUploadLoading}
            templatesLoading={templatesLoading}
          />
        </div>
      </div>

      {/* Middle - Video Preview */}
      <div className="flex-1 bg-[#1a1d24] flex flex-col items-center rounded-lg relative p-2 sm:p-4 md:p-6 pt-2 pb-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  opacity: 0.85,
                  mixBlendMode: 'color',
                  zIndex: 10,
                }}
              ></div>
            </div>
            <Image
              src={'/face.webp'}
              alt="Face Changing"
              fill
              className="object-contain"
              style={{
                zIndex: 5,
                filter: 'contrast(1.2) brightness(1.1)',
              }}
              priority
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Face Swap
            </h2>
            <span className="text-sm text-tertiary">Support video for face swapping</span>
          </div>
        </div>

        {selectedTemplate ? (
          <div className="w-[calc(100%-160px)] h-[calc(100vh-240px)] max-h-[480px] surface-tertiary rounded-[20px] border-2 border-dashed border-accent/50 relative mt-3 flex items-center justify-center shadow-lg">
            {/* Close button for clearing selection */}
            <div className="absolute top-2 right-2 z-10">
              <CloseButton
                onClick={() => {
                  setSelectedTemplate(null)
                  setTargetPath(null)
                  setSelectedFace(null)
                  setSelectedSource(null)
                  setSourcePath(null)
                }}
                variant="dark"
              />
            </div>
            <div className="w-full h-full flex items-center justify-center">
              {selectedTemplate.mimeType?.startsWith('video/') ? (
                <video
                  src={getStorageUrl(selectedTemplate.filePath)}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                  poster={
                    selectedTemplate.thumbnailPath
                      ? getStorageUrl(selectedTemplate.thumbnailPath)
                      : undefined
                  }
                />
              ) : (
                <Image
                  src={getStorageUrl(selectedTemplate.filePath) || '/placeholder-thumbnail.svg'}
                  alt={selectedTemplate.filename}
                  className="object-contain rounded-lg"
                  width={800}
                  height={600}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="w-[calc(100%-160px)] h-[calc(100vh-240px)] max-h-[480px] bg-[#2a2832] rounded-[20px] border-2 border-dashed border-white/70 relative mt-3 flex items-center justify-center">
            <div className="text-center p-12 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <ArrowLeftRight className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-xl text-gray-300 font-medium">
                  Step 1: Select a template to preview
                </p>
                <p className="text-xl text-gray-300 font-medium">
                  Step 2: Add a face from the right panel, then generate
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Face Selection and History */}
      <div className="w-1/4 lg:w-1/4 md:w-1/3 sm:w-2/5 surface-secondary rounded-xl flex flex-col border border-primary shadow-lg">
        {/* Tab Navigation */}
        <div className="p-2 sm:p-3 md:p-4 border-b border-primary">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setRightSideTab('face-swap')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm cursor-pointer font-medium transition-all duration-300 ${
                rightSideTab === 'face-swap'
                  ? 'gradient-primary text-white shadow-lg glow-primary'
                  : 'text-tertiary hover:surface-tertiary hover:text-secondary'
              }`}
            >
              Face Swap
              <span className="ml-0">
                <Info
                  className="inline-block ml-1 w-4 h-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setIsModalOpen(true)}
                />
              </span>
            </button>
            <button
              onClick={() => setRightSideTab('history')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm cursor-pointer font-medium transition-all duration-300 ${
                rightSideTab === 'history'
                  ? 'gradient-primary text-white shadow-lg glow-primary'
                  : 'text-tertiary hover:surface-tertiary hover:text-secondary'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {rightSideTab === 'face-swap' ? (
            <div className="p-2 sm:p-3 md:p-4">
              <FaceSelection
                selectedTemplate={selectedTemplate}
                selectedFace={selectedFace}
                onFaceSelect={setSelectedFace}
                imageSources={imageSources}
                selectedSource={selectedSource}
                onSourceSelect={handleSourceSelect}
                onSourceUpload={handleSourceUpload}
                onSourceDelete={handleSourceDelete}
                processing={processing}
              />

              {/* Generate Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedSource || !selectedTemplate || processing}
                className={`mt-4 py-3 px-6 rounded-xl w-full font-semibold text-base flex items-center justify-center gap-3 transform transition-all duration-300 ${
                  selectedSource && selectedTemplate && !processing
                    ? 'btn-primary hover:scale-[1.02] active:scale-[0.98] glow-primary'
                    : 'surface-tertiary text-muted cursor-not-allowed border border-primary'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loading className="animate-spin" />
                    <span className="animate-pulse">Processing...</span>
                  </span>
                ) : (
                  <>
                    <MdFace className="w-6 h-6 text-white" />
                    <span>Generate</span>
                  </>
                )}
              </button>

              {processing && (
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg mt-4">
                  Error: {error}
                </div>
              )}

              {result && (
                <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-lg mt-4">
                  Success! Result saved as {result.file}
                </div>
              )}
            </div>
          ) : (
            <div className="p-1 sm:p-2 md:p-3">
              {/* Header with Gallery Link */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent History</h2>
                <button
                  onClick={() => window.open('/gallery', '_blank')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                  title="View all in Gallery"
                >
                  <span>View All</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[#2a2d34] rounded-xl overflow-hidden relative">
                      <div className="relative">
                        {/* Enhanced gradient background with better shimmer */}
                        <div className="w-full h-24 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#2a2d34] via-[#3a3d44] to-[#2a2d34] bg-[length:400%_100%] animate-shimmer" />
                        </div>
                        {/* Improved loading animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            {[0, 1, 2].map(dot => (
                              <div
                                key={dot}
                                className="w-2 h-2 rounded-full bg-blue-400 animate-bounce-delay"
                                style={{ animationDelay: `${dot * 150}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {generatedVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-[#2a2d34] rounded-xl">
                      <div className="w-12 h-12 mb-3 text-gray-400 flex items-center justify-center rounded-full bg-[#3a3d44]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-2">No videos yet</h3>
                      <p className="text-gray-400 text-center text-xs mb-3">
                        Create your first face swap
                      </p>
                      <button
                        onClick={() => setRightSideTab('face-swap')}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs"
                      >
                        Start Creating
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2">
                      {generatedVideos.map(media => (
                        <div
                          key={media.id}
                          className="group bg-[#2a2d34] p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl cursor-pointer hover:bg-[#3a3d44] transition-colors relative"
                          onClick={() => handleVideoClick(media)}
                        >
                          <div className="relative">
                            {media.type === 'video' ? (
                              <VideoPlayerWithLoading
                                src={getStorageUrl(media.filePath)}
                                className="w-full h-24 sm:h-32 md:h-40 rounded-md sm:rounded-lg mb-1 sm:mb-2"
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                optimizedLoading={true}
                                thumbnail={getStorageUrl(media.thumbnailPath)}
                              />
                            ) : (
                              <Image
                                src={getStorageUrl(media.filePath) || '/placeholder-thumbnail.svg'}
                                alt={media.name}
                                width={300}
                                height={160}
                                className="rounded-md sm:rounded-lg mb-1 sm:mb-2 h-24 sm:h-32 md:h-40 object-cover w-full"
                              />
                            )}

                            {/* Video Duration Badge - Top Left */}
                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium z-30 pointer-events-none">
                              {getVideoDuration(media)}
                            </div>

                            {/* Payment/Download Button - Top Right */}
                            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-30">
                              {media.isPaid ? (
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleDownload(media)
                                  }}
                                  className="group/btn p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                                </button>
                              ) : (
                                <button
                                  onClick={e => handlePurchase(media, e)}
                                  className="group/btn p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                                  title={`Purchase for ${PRICING_CONFIG.getFormattedPrice()}`}
                                >
                                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                                </button>
                              )}
                            </div>

                            {/* Lock overlay for unpaid videos */}
                            {!media.isPaid && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                              </div>
                            )}

                            {/* Payment success overlay */}
                            {paymentSuccessId === media.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 animate-pulse z-25">
                                <div className="bg-green-500 text-white px-3 py-2 rounded-md font-medium">
                                  Payment Successful!
                                </div>
                              </div>
                            )}

                            {/* Hover overlay with video info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end z-10">
                              <div className="p-1 sm:p-2 w-full">
                                <div className="text-white font-medium text-xs truncate mb-1">
                                  {media.name}
                                </div>
                                <div className="text-gray-300 text-xs">
                                  {new Date(media.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDownload={() => handleDownload(selectedVideo)}
          onDelete={() => handleDelete(selectedVideo)}
        />
      )}

      {isModalOpen && <GuidelineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      {/* Payment Modal */}
      <PaymentModal
        media={selectedMediaForPurchase}
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
      />
    </div>
  )
}
