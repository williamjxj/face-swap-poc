import Image from 'next/image'
import { Plus } from 'lucide-react'
import { getStorageUrl } from '@/utils/storage-helper'
import styles from './page.module.css'
import { useState, useRef, useEffect } from 'react'

import Loading from '@/components/Loading'

export default function FaceSelection({
  selectedTemplate,
  selectedFace,
  onFaceSelect,
  imageSources,
  selectedSource,
  onSourceSelect,
  onSourceUpload,
  onSourceDelete,
  processing,
}) {
  // State to manage tooltip
  const [tooltip, setTooltip] = useState({ visible: false, content: '', position: { x: 0, y: 0 } })
  const tooltipTimeoutRef = useRef(null)

  // Clear tooltip timeout when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  // Handler for mouse enter event
  const handleMouseEnter = (image, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Set a 2-second timeout before showing the tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: true,
        content: image.name || `Source ${image.id}`,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        },
      })
    }, 2000) // 2000ms = 2 seconds
  }

  // Handler for mouse leave event
  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setTooltip({ ...tooltip, visible: false })
  }

  return (
    <div className="p-4">
      {/* Face Selection Preview */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4 text-white">Face Selection</h2>
        <div className="flex gap-4 justify-center relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
            {selectedTemplate ? (
              selectedTemplate.thumbnailPath ? (
                // If we have a thumbnail, use it
                <Image
                  src={
                    getStorageUrl(selectedTemplate.thumbnailPath) || '/placeholder-thumbnail.svg'
                  }
                  alt="Template thumbnail"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : selectedTemplate.mimeType?.startsWith('video/') ? (
                // If it's a video without thumbnail, show video element
                <video
                  src={getStorageUrl(selectedTemplate.filePath)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                // If it's an image/gif, show as image
                <Image
                  src={getStorageUrl(selectedTemplate.filePath) || '/placeholder-thumbnail.svg'}
                  alt="Template thumbnail"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-[#2a2d34] flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className={styles.connecting_line}></div>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
            {selectedSource ? (
              <Image
                src={getStorageUrl(selectedSource.preview) || '/placeholder-thumbnail.svg'}
                alt="Selected face"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2a2d34] flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Images Grid */}
      <div className="flex-grow">
        <h2 className="text-lg font-bold mb-4 text-white">Source Images</h2>
        <div className="grid grid-cols-3 gap-2">
          {/* Upload button */}
          <label
            className={`w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#2a2d34] transition-colors ${
              processing ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onSourceUpload}
              disabled={processing}
            />
            {processing ? <Loading /> : <Plus className="w-6 h-6 text-gray-400" />}
          </label>

          {/* Source images */}
          {imageSources.map(image => (
            <div key={image.id} className="relative">
              <div
                className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  selectedSource?.name === image.name
                    ? 'ring-2 ring-blue-500 scale-[1.02]'
                    : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
                }`}
                onClick={() => onSourceSelect(image)}
                onMouseEnter={e => handleMouseEnter(image, e)}
                onMouseLeave={handleMouseLeave}
              >
                <Image
                  src={getStorageUrl(image.imagePath) || '/placeholder-thumbnail.svg'}
                  alt={`Source ${image.id}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={e => onSourceDelete(image, e)}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip component */}
      {tooltip.visible && (
        <div
          className="fixed px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`,
            opacity: tooltip.visible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {tooltip.content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
        </div>
      )}
    </div>
  )
}
