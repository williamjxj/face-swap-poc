'use client'
import Image from 'next/image'
import { Info, ArrowLeftRight, Download, Lock, Wand2, Sparkles } from 'lucide-react'
import FaceSelection from './FaceSelection'
import { useState, useEffect } from 'react'
import VideoModal from '@/components/VideoModal'
import GuidelineModal from '@/components/GuidelineModal'
import Loading from '@/components/Loading'
import TabContent from './TabContent'
import CloseButton from '@/components/CloseButton'
import StripeCheckoutButton from '@/components/StripeCheckoutButton'
import VideoPlayerWithLoading from '@/components/VideoPlayerWithLoading'
import { MdFace } from 'react-icons/md'

export default function FaceFusion() {
  // State declarations
  const [selectedTab, setSelectedTab] = useState('video')
  const [rightSideTab, setRightSideTab] = useState('face-swap')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentSuccessId, setPaymentSuccessId] = useState(null)
  const [targetPath, setTargetPath] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [imageSources, setImageSources] = useState([])
  const [videoTargets, setVideoTargets] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedFace, setSelectedFace] = useState(null)
  const [loading, setLoading] = useState(true)
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
          console.error('Error refreshing videos after payment:', error)
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
        const response = await fetch('/api/templates')
        if (!response.ok) {
          throw new Error('Failed to load templates')
        }
        const data = await response.json()
        console.log('Loaded templates from server:', data.templates)
        setVideoTargets(data.templates)
        setTemplates(data.templates)
        // Do not auto-select first template on initial load
        // Template will be selected when user clicks on it
      } catch (error) {
        console.error('Error loading templates:', error)
        setError('Failed to load templates')
      } finally {
        setLoading(false)
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
        console.error('Error loading generated videos:', error)
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
              imagePath: file.filePath,
              createdAt: file.createdAt || 0,
            }))
            .sort((a, b) => b.createdAt - a.createdAt) // Sort by creation time descending
          setImageSources(sources)
        }
      } catch (error) {
        console.error('Error loading image sources:', error)
      }
    }

    loadImageSources()
  }, [])

  const handleTargetSelect = target => {
    setSelectedTarget(target)
    setTargetPath(target.filePath)
  }

  const handleSourceUpload = async e => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setUploadProcessing(true)
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

        // Check if we got a partial success (file saved but database record not created)
        let newImage
        if (response.status === 207 && data.success && data.error) {
          // This means the file was saved but database record wasn't created
          console.warn('Partial success:', data.error)

          const sourcePath = `/sources/${data.filename}`

          // Update selected source and path
          const newSource = {
            preview: sourcePath,
            name: data.filename,
            // Add a flag to indicate this is a file-only source (not in database)
            fileOnly: true,
          }
          setSelectedSource(newSource)
          setSourcePath(sourcePath)

          // Add to imageSources with fileOnly flag
          newImage = {
            id: Date.now(), // Use timestamp as temporary id
            name: data.filename,
            imagePath: sourcePath,
            createdAt: Date.now(),
            fileOnly: true, // Flag to indicate this isn't in the database
          }
        } else {
          // Normal success - database record was created
          const sourcePath = `/sources/${data.filename}`

          // Update selected source and path
          const newSource = {
            preview: sourcePath,
            name: data.filename,
            id: data.id,
          }
          setSelectedSource(newSource)
          setSourcePath(sourcePath)

          // Add to imageSources with database ID
          newImage = {
            id: data.id, // Use the real database ID
            name: data.filename,
            imagePath: sourcePath,
            createdAt: Date.now(),
          }
        }

        // Add the new image to the beginning of imageSources
        setImageSources(prev => [newImage, ...prev])
      } catch (error) {
        console.error('Error uploading file:', error)
        setError('Failed to upload image')
      } finally {
        setUploadProcessing(false)
      }
    }
  }

  const handleSourceSelect = image => {
    setSelectedSource({
      preview: image.imagePath,
      name: image.name,
    })
    setSourcePath(image.imagePath)
  }

  const handleSubmit = async () => {
    console.log('handleSubmit: ', sourcePath, targetPath)

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
      console.error('Face swap error:', error)
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

  // Handle download of video
  const handleDownload = async video => {
    if (!video.isPaid) {
      setError('Please purchase the video to download')

      // Open the video modal for payment
      setSelectedVideo(video)
      return
    }

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
        console.error('Error updating download count:', err)
      }
    } catch (error) {
      console.error('Error downloading video:', error)
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
      console.log('Deleting face source:', image.name)

      // Check if this is a file-only source (not in database)
      if (image.fileOnly) {
        console.log('This is a file-only source, skipping database delete')
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
        console.error('Delete face source failed:', errorData)
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
      console.error('Error deleting source image:', error)
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
      setVideoTargets(prev => prev.filter(template => template.id !== templateId))

      // Clear selection if this was the selected template
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
        setTargetPath(null)
        setSelectedFace(null)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      setError('Failed to delete template')
    }
  }

  const handleTargetUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Set loading state
        setVideoUploadLoading(true)

        // Check file size (500MB limit)
        if (file.size > 150 * 1024 * 1024) {
          setError('File size exceeds 150MB limit')
          setVideoUploadLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('templateType', 'video')

        console.log('Uploading file:', {
          name: file.name,
          type: file.type,
          size: file.size,
        })

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('Upload failed with status:', response.status, 'Error:', errorData)
          throw new Error(`Upload failed: ${errorData}`)
        }

        const data = await response.json()
        console.log('Upload response:', data)

        // Create a new template object matching the database schema
        const newTemplate = {
          id: data.id,
          filename: data.filename,
          type: 'video',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize), // Convert string back to BigInt
          mimeType: data.mimeType,
        }

        console.log('Created template object:', newTemplate)

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev])
        setVideoTargets(prev => [newTemplate, ...prev])

        // Select the new template - this will update both the middle preview and the face selection circle
        setSelectedTemplate(newTemplate)
        setSelectedFace(0) // Reset face selection
        setTargetPath(newTemplate.filePath) // Ensure target path is updated
      } catch (error) {
        console.error('Error uploading template:', error)
        setError(error.message || 'Failed to upload template')
      } finally {
        // Reset loading state
        setVideoUploadLoading(false)
      }
    }
  }

  const handleImageUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Set loading state
        setImageUploadLoading(true)

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size exceeds 10MB limit')
          setImageUploadLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('templateType', 'image')

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
          type: 'image',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize),
          mimeType: data.mimeType,
        }

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev])
        setVideoTargets(prev => [newTemplate, ...prev])

        // Select the new template
        setSelectedTemplate(newTemplate)
        setSelectedFace(0)
        setTargetPath(newTemplate.filePath) // Ensure target path is updated
      } catch (error) {
        console.error('Error uploading image:', error)
        setError(error.message || 'Failed to upload image')
      } finally {
        // Reset loading state
        setImageUploadLoading(false)
      }
    }
  }

  const handleGifUploadWrapper = async e => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Set loading state
        setGifUploadLoading(true)

        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          setError('File size exceeds 50MB limit')
          setGifUploadLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('templateType', 'gif')

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
          type: 'gif',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize),
          mimeType: data.mimeType,
        }

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev])
        setVideoTargets(prev => [newTemplate, ...prev])

        // Select the new template
        setSelectedTemplate(newTemplate)
        setSelectedFace(0)
        setTargetPath(newTemplate.filePath) // Ensure target path is updated
      } catch (error) {
        console.error('Error uploading GIF:', error)
        setError(error.message || 'Failed to upload GIF')
      } finally {
        // Reset loading state
        setGifUploadLoading(false)
      }
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

          // Update both templates and videoTargets
          setTemplates(prev => [newTemplate, ...prev])
          setVideoTargets(prev => [newTemplate, ...prev])

          // Select the new template
          setSelectedTemplate(newTemplate)
          setSelectedFace(0)
          setTargetPath(newTemplate.filePath) // Ensure target path is updated
        }
      } catch (error) {
        console.error('Error uploading multi-face templates:', error)
        setError(error.message || 'Failed to upload multi-face templates')
      } finally {
        // Reset loading state
        setMultiFaceUploadLoading(false)
      }
    }
  }

  // Functions
  const fetchVideos = async () => {
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
      console.error('Error loading videos:', error)
      setError('Failed to load videos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-4rem)] bg-[#0a0a0f] p-4">
      {/* Left side - Tab navigation */}
      <div className="w-1/4 bg-[#13131a] rounded-xl flex flex-col border border-[#2a2a35] shadow-xl">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-[#2a2a35]">
          <div className="flex space-x-1">
            {tabOptions.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-[#1a1a23] hover:text-white'
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
          />
        </div>
      </div>

      {/* Middle - Video Preview */}
      <div className="flex-1 bg-[#13131a] flex flex-col items-center rounded-xl relative p-6 border border-[#2a2a35] shadow-xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Wand2 size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold krea-gradient-text">AI Face Swap</h2>
            <span className="text-sm text-gray-400">Support video for face swapping</span>
          </div>
        </div>

        {selectedTemplate ? (
          <div className="w-full max-w-2xl h-[calc(100vh-280px)] bg-[#1a1a23] rounded-xl border-2 border-dashed border-[#3a3a45] relative flex items-center justify-center overflow-hidden">
            {/* Close button for clearing selection */}
            <div className="absolute top-3 right-3 z-10">
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
                  src={selectedTemplate.filePath}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                  poster={selectedTemplate.thumbnailPath}
                />
              ) : (
                <Image
                  src={selectedTemplate.filePath || '/placeholder.svg'}
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
          <div className="w-full max-w-2xl h-[calc(100vh-280px)] bg-[#1a1a23] rounded-xl border-2 border-dashed border-[#3a3a45] relative flex items-center justify-center">
            <div className="text-center p-12 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                  <ArrowLeftRight className="w-8 h-8 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl text-gray-300 font-medium">
                    Step 1: Select a template to preview
                  </p>
                  <p className="text-xl text-gray-300 font-medium">
                    Step 2: Add a face from the right panel, then generate
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Face Selection and History */}
      <div className="w-1/4 bg-[#13131a] rounded-xl flex flex-col border border-[#2a2a35] shadow-xl">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-[#2a2a35]">
          <div className="flex space-x-1">
            <button
              onClick={() => setRightSideTab('face-swap')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                rightSideTab === 'face-swap'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-[#1a1a23] hover:text-white'
              }`}
            >
              <Sparkles size={16} />
              Face Swap
              <Info
                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-300"
                onClick={() => setIsModalOpen(true)}
              />
            </button>
            <button
              onClick={() => setRightSideTab('history')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                rightSideTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-[#1a1a23] hover:text-white'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {rightSideTab === 'face-swap' ? (
            <div className="p-4">
              <FaceSelection
                selectedTemplate={selectedTemplate}
                selectedFace={selectedFace}
                onFaceSelect={setSelectedFace}
                imageSources={imageSources}
                selectedSource={selectedSource}
                onSourceSelect={handleSourceSelect}
                onSourceUpload={handleSourceUpload}
                onSourceDelete={handleSourceDelete}
                processing={uploadProcessing}
              />

              {/* Generate Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedSource || !selectedTemplate || processing}
                className={`mt-6 py-4 px-6 rounded-xl w-full font-semibold text-base flex items-center justify-center gap-3 shadow-xl transform transition-all duration-300 ${
                  selectedSource && selectedTemplate && !processing
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white cursor-pointer hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
                    : 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-white/60 cursor-not-allowed'
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
                <div className="w-full bg-[#2a2a35] rounded-full h-3 mt-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg mt-4">
                  Error: {error}
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg mt-4">
                  Successful! Your video is ready in History tab.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4 text-white">Generated Media</h2>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-[#1a1a23] p-3 rounded-lg cursor-default transition-colors relative overflow-hidden border border-[#2a2a35]"
                    >
                      <div className="relative">
                        {/* Enhanced gradient background with better shimmer */}
                        <div className="w-full h-32 rounded-lg mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a23] via-[#2a2a35] to-[#1a1a23] bg-[length:400%_100%] animate-shimmer" />
                        </div>
                        {/* Improved loading animation */}
                        <div className="flex flex-col items-center justify-center h-12 gap-2">
                          <div className="flex items-center gap-2">
                            {[0, 1, 2].map(dot => (
                              <div
                                key={dot}
                                className="w-2 h-2 rounded-full bg-blue-400 animate-bounce-delay"
                                style={{ animationDelay: `${dot * 150}ms` }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-sm text-gray-300 font-medium animate-pulse-opacity">
                              Loading your videos...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {generatedVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-[#1a1a23] rounded-xl border border-[#2a2a35]">
                      <div className="w-16 h-16 mb-4 text-gray-400 flex items-center justify-center rounded-full bg-[#2a2a35]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
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
                      <h3 className="text-lg font-medium text-white mb-2">No videos yet</h3>
                      <p className="text-gray-400 text-center mb-4">
                        Create your first face swap by selecting a target video and your face image
                      </p>
                      <button
                        onClick={() => setRightSideTab('face-swap')}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
                      >
                        Create Your First Swap
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {generatedVideos.map(media => (
                        <div
                          key={media.id}
                          className="bg-[#1a1a23] p-3 rounded-lg cursor-pointer hover:bg-[#2a2a35] transition-all duration-200 relative border border-[#2a2a35] hover:border-[#3a3a45]"
                          onClick={() => handleVideoClick(media)}
                        >
                          <div className="relative">
                            {media.type === 'video' ? (
                              <VideoPlayerWithLoading
                                src={media.filePath}
                                className="w-full h-32 rounded-lg mb-2"
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                optimizedLoading={true}
                                thumbnail={media.thumbnailPath}
                              />
                            ) : (
                              <Image
                                src={media.filePath || '/placeholder.svg'}
                                alt={media.name}
                                width={300}
                                height={128}
                                className="rounded-lg mb-2"
                                style={{
                                  width: '100%',
                                  height: '8rem',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                }}
                              />
                            )}
                            {!media.isPaid && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <Lock className="w-8 h-8 text-white" />
                              </div>
                            )}
                            {paymentSuccessId === media.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 animate-pulse rounded-lg">
                                <div className="bg-green-500 text-white px-3 py-2 rounded-md font-medium">
                                  Payment Successful!
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white truncate">{media.name}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(media.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {media.isPaid ? (
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleDownload(media)
                                  }}
                                  className="p-1 hover:bg-blue-500/20 rounded"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4 text-blue-400" />
                                </button>
                              ) : (
                                <StripeCheckoutButton video={media} disabled={false} small={true} />
                              )}
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
    </div>
  )
}
