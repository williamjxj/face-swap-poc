'use client'
import { X, Download, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

export default function VideoModal({ video, onClose, onDownload, onDelete }) {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleModalClick = useCallback((e) => {
    e.stopPropagation()
  }, [])

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative bg-[#1a1d24] rounded-lg w-[90%] max-w-2xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <video
          src={video.url}
          controls
          className="w-full rounded-lg mb-4 max-h-[70vh] object-contain"
          autoPlay
        />
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-md"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}