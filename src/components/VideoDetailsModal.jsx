'use client'
import { X, Download, Eye, Calendar, Clock, FileText, Tag, ShoppingCart } from 'lucide-react'
import { PRICING_CONFIG } from '@/config/pricing'

export default function VideoDetailsModal({ video, isOpen, onClose, onDownload, onPurchase }) {
  if (!isOpen || !video) return null

  const formatFileSize = bytes => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = seconds => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d24] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Video Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#2a2d34] hover:bg-[#3a3d44] text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Preview */}
          <div className="relative mb-6 rounded-lg overflow-hidden bg-[#2a2d34]">
            <video
              src={video.filePath}
              className="w-full max-h-96 object-contain"
              controls
              poster={video.thumbnailPath}
            />

            {/* Video Duration Overlay */}
            <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              {video.isPaid ? (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                  PURCHASED
                </span>
              ) : (
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded font-medium">
                  PREVIEW
                </span>
              )}
            </div>
          </div>

          {/* Video Information */}
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {video.name || video.filename || 'Untitled Video'}
              </h3>
              {video.description && <p className="text-gray-400 text-sm">{video.description}</p>}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="text-gray-400" size={16} />
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="text-gray-400" size={16} />
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{formatDuration(video.duration)}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="text-gray-400" size={16} />
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white">{formatFileSize(video.fileSize)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Eye className="text-gray-400" size={16} />
                  <span className="text-gray-400">Downloads:</span>
                  <span className="text-white">{video.downloadCount || 0}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Tag className="text-gray-400" size={16} />
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{video.type || 'Video'}</span>
                </div>

                {video.resolution && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">Resolution:</span>
                    <span className="text-white">{video.resolution}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#2a2d34] text-gray-300 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {video.isPaid
              ? 'You own this video'
              : `Purchase for ${PRICING_CONFIG.getFormattedPrice()}`}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#2a2d34] hover:bg-[#3a3d44] text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              Close
            </button>

            {video.isPaid ? (
              <button
                onClick={() => onDownload(video)}
                className="group px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
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
                className="group px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
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
    </div>
  )
}
