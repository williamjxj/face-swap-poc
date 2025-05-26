'use client'
import { Download, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import StripeCheckoutButton from './StripeCheckoutButton'
import AtlosCheckoutButton from './AtlosCheckoutButton'
import CloseButton from './CloseButton'
import VideoPlayerWithLoading from './VideoPlayerWithLoading'

export default function VideoModal({ video, onClose, onDownload, onDelete }) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleBackdropClick = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const handleModalClick = useCallback(e => {
    e.stopPropagation()
  }, [])

  const handleCloseClick = useCallback(
    e => {
      e.stopPropagation()
      onClose()
    },
    [onClose]
  )

  const handleDelete = async () => {
    if (
      window.confirm('Are you sure you want to delete this video? This action cannot be undone.')
    ) {
      try {
        setIsDeleting(true)

        const response = await fetch('/api/videos/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: video.id }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete video')
        }

        // Call the onDelete callback to update the UI
        if (onDelete) {
          onDelete(video.id)
        }

        // Close the modal
        onClose()
      } catch (error) {
        console.error('Error deleting video:', error)
        alert('Failed to delete the video. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

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
        <div className="absolute top-2 right-2 z-10">
          <CloseButton onClick={handleCloseClick} variant="default" size="medium" />
        </div>

        {video.type === 'video' ? (
          <VideoPlayerWithLoading
            src={video.filePath}
            controls
            className="w-full rounded-lg mb-4 max-h-[70vh] object-contain"
            autoPlay
            thumbnail={video.thumbnailPath}
            showDuration={true}
            optimizedLoading={true}
          />
        ) : (
          <Image
            src={video.filePath}
            alt={video.name}
            className="rounded-lg mb-4 max-h-[70vh] object-contain"
            width={1280}
            height={720}
            style={{
              maxHeight: '70vh',
              width: 'auto',
              margin: '0 auto',
            }}
          />
        )}

        <div className="space-y-4">
          {!showPaymentOptions ? (
            <div className="flex justify-between gap-2">
              {/* Delete button on the left */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-md ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>

              {/* Payment and download buttons on the right */}
              <div className="flex gap-2">
                {!video.isPaid && (
                  <button
                    onClick={togglePaymentOptions}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-md cursor-pointer"
                  >
                    Checkout
                  </button>
                )}
                <button
                  onClick={onDownload}
                  disabled={!video.isPaid}
                  className={`flex items-center gap-2 px-3 py-2 ${
                    video.isPaid
                      ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      : 'bg-gray-500 cursor-not-allowed opacity-50'
                  } rounded-md`}
                >
                  <Download className="w-4 h-4" />
                  {video.isPaid ? 'Download' : 'Pay to Download'}
                </button>
              </div>
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
