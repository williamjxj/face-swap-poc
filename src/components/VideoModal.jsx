'use client'
import { X, Download, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import StripeCheckoutButton from './StripeCheckoutButton'
import AtlosCheckoutButton from './AtlosCheckoutButton'

export default function VideoModal({ video, onClose, onDownload, onDelete }) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleModalClick = useCallback((e) => {
    e.stopPropagation()
  }, [])
  
  const togglePaymentOptions = () => {
    setShowPaymentOptions(prev => !prev)
  }

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
          className="absolute top-2 right-2 p-2 hover:bg-gray-700/80 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center"
        >
          <X className="w-6 h-6 pointer-events-none" />
        </button>
        
        {video.type === 'video' ? (
          <video
            src={video.filePath}
            controls
            className="w-full rounded-lg mb-4 max-h-[70vh] object-contain"
            autoPlay
          />
        ) : (
          <img
            src={video.filePath}
            alt={video.name}
            className="w-full rounded-lg mb-4 max-h-[70vh] object-contain"
          />
        )}
        
        <div className="space-y-4">
          {!showPaymentOptions ? (
            <div className="flex justify-end gap-2">
              <button
                onClick={togglePaymentOptions}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-md cursor-pointer"
              >
                Checkout
              </button>
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2 text-center">Choose Payment Method</h3>
              <div className="flex justify-center gap-3">
                <StripeCheckoutButton video={video} />
                <AtlosCheckoutButton video={video} />
              </div>
              <div className="text-center">
                <button
                  onClick={togglePaymentOptions}
                  className="text-sm text-gray-400 hover:text-white underline"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
