import Image from 'next/image'
import UploadBox from './UploadBox'
import { formatDuration } from '@/utils/helper'
import { useState, useEffect, useRef } from 'react'
import Loading from '@/components/Loading'

export default function TabContent({
  selectedTab,
  templates,
  selectedTemplate,
  onSelectTemplate,
  onTargetUpload,
  onImageUpload,
  onGifUpload,
  onMultiFaceUpload,
  onDeleteTemplate,
  onSelectSourceForTemplate,
  videoUploadLoading,
  imageUploadLoading,
  gifUploadLoading,
  multiFaceUploadLoading,
}) {
  const [hoveredTemplate, setHoveredTemplate] = useState(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState(null)
  const tooltipTimeoutRef = useRef(null)

  // Clear the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  // Filter templates based on selected tab
  const filteredTemplates = templates.filter(template => {
    // Log the template type for debugging
    // console.log(`Template ${template.filename}: type=${template.type}, mimeType=${template.mimeType}`);

    switch (selectedTab) {
      case 'video':
        return template.type === 'video' || template.mimeType?.startsWith('video/')
      case 'image':
        // Only show in Image tab if type is explicitly 'image' AND not 'multi-face'
        return (
          template.type === 'image' ||
          (template.mimeType?.startsWith('image/') &&
            template.mimeType !== 'image/gif' &&
            template.type !== 'multi-face')
        )
      case 'gif':
        return template.type === 'gif' || template.mimeType === 'image/gif'
      case 'multi-face':
        // Show in Multi-face tab if the type is explicitly 'multi-face'
        return template.type === 'multi-face'
      default:
        return false
    }
  })

  const renderTemplatePreview = template => {
    if (template.mimeType?.startsWith('video/')) {
      return (
        <Image
          src={template.thumbnailPath}
          alt={template.filename}
          className="object-cover rounded-lg target-dimensions"
          width={116}
          height={176}
        />
      )
    } else {
      // For images and GIFs, use the file path directly
      return (
        <Image
          src={template.filePath}
          alt={template.filename}
          className="object-cover rounded-lg target-dimensions"
          width={116}
          height={176}
        />
      )
    }
  }

  const renderTemplateCard = template => (
    <div
      key={template.id}
      className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
        selectedTemplate?.id === template.id
          ? 'ring-2 ring-blue-500 scale-[1.02]'
          : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
      }`}
      onClick={() => {
        // For image, gif, and multi-face tabs, we want to also select the source
        if (selectedTab === 'image' || selectedTab === 'gif' || selectedTab === 'multi-face') {
          if (onSelectSourceForTemplate) {
            onSelectSourceForTemplate(template)
          } else {
            onSelectTemplate(template)
          }
        } else {
          onSelectTemplate(template)
        }
      }}
      onMouseEnter={() => {
        tooltipTimeoutRef.current = setTimeout(() => {
          setHoveredTemplate(template)
        }, 2000)
      }}
      onMouseLeave={() => {
        clearTimeout(tooltipTimeoutRef.current)
        setHoveredTemplate(null)
      }}
    >
      <div className="relative group">
        {renderTemplatePreview(template)}
        <button
          onClick={async e => {
            e.stopPropagation()
            setDeletingTemplateId(template.id)
            try {
              await onDeleteTemplate(template.id, e)
            } finally {
              setDeletingTemplateId(null)
            }
          }}
          className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80 cursor-pointer"
          disabled={deletingTemplateId === template.id}
        >
          {deletingTemplateId === template.id ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-3 h-3">
                <Loading />
              </div>
            </div>
          ) : (
            '×'
          )}
        </button>
        {template.duration && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="text-white text-xs font-medium">
              {formatDuration(template.duration)}
            </div>
          </div>
        )}
        {selectedTemplate?.id === template.id && (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
        )}
      </div>
      {hoveredTemplate?.id === template.id && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-white text-xs rounded-md w-full z-10">
          <p className="truncate text-center font-medium">{template.filename}</p>
        </div>
      )}
    </div>
  )

  const renderVideoTab = () => (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="video"
            accept="video/mp4,video/wav"
            onUpload={onTargetUpload}
            title="Custom Video"
            description="Video: Max 150MB/3mins"
            className="w-full h-full"
            loading={videoUploadLoading}
          />
        </div>
        {filteredTemplates.map(renderTemplateCard)}
      </div>
    </div>
  )

  const renderImageTab = () => (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="image"
            accept="image/png,image/jpeg,image/jpg"
            onUpload={onImageUpload}
            title="Upload Image"
            description="PNG, JPEG up to 10MB"
            className="w-full h-full"
            loading={imageUploadLoading}
          />
        </div>
        {filteredTemplates.map(renderTemplateCard)}
      </div>
    </div>
  )

  const renderGifTab = () => (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="gif"
            accept="image/gif"
            onUpload={onGifUpload}
            title="Upload GIF"
            description="GIF up to 50MB"
            className="w-full h-full"
            loading={gifUploadLoading}
          />
        </div>
        {filteredTemplates.map(renderTemplateCard)}
      </div>
    </div>
  )

  const renderMultiFaceTab = () => (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="multi-face"
            accept="image/png,image/jpeg,image/jpg"
            onUpload={onMultiFaceUpload}
            title="Multi-face Upload"
            description="Upload multiple faces (PNG, JPEG)"
            className="w-full h-full"
            loading={multiFaceUploadLoading}
          />
        </div>
        {filteredTemplates.map(renderTemplateCard)}
      </div>
    </div>
  )

  switch (selectedTab) {
    case 'video':
      return renderVideoTab()
    case 'image':
      return renderImageTab()
    case 'gif':
      return renderGifTab()
    case 'multi-face':
      return renderMultiFaceTab()
    default:
      return null
  }
}
