'use client'
import { X, Download, Trash2, CreditCard } from 'lucide-react'
import { useCallback, useState } from 'react'

export default function VideoModal({ video, onClose, onDownload, onDelete }) {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleModalClick = useCallback((e) => {
    e.stopPropagation()
  }, [])
  
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: video.name,
          imageUrl: `http://localhost:3000${video.url}`,
        })
      })
      
      if (!response.ok) {
        throw new Error('Checkout failed')
      }
      
      const data = await response.json()

      console.log('Checkout response:', data)
      // Redirect to checkout URL if provided
      if (data.url) {
        window.location.href = data.url
      }
      else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
    }
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
        
        <video
          src={video.url}
          controls
          className="w-full rounded-lg mb-4 max-h-[70vh] object-contain"
          autoPlay
        />
        
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCheckout}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-md cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
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
      </div>
    </div>
  )
}
