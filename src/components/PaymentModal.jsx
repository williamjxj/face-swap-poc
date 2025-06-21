'use client'

import { useState } from 'react'
import { X, CreditCard, Bitcoin } from 'lucide-react'

// PayPal icon component
const PayPalIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.394.45.67.96.824 1.517z" />
  </svg>
)
import StripeCheckoutButton from './StripeCheckoutButton'
import PayPalCheckoutButton from './PayPalCheckoutButton'
import AtlosCheckoutButton from './AtlosCheckoutButton'

export default function PaymentModal({ media, isOpen, onClose }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)

  if (!isOpen || !media) return null

  const handleClose = () => {
    setSelectedPaymentMethod(null)
    onClose()
  }

  const handlePaymentMethodSelect = method => {
    setSelectedPaymentMethod(method)
  }

  const handleBackToOptions = () => {
    setSelectedPaymentMethod(null)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#1a1d24] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Purchase Media</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Media Info */}
        <div className="mb-6 p-4 bg-[#2a2d34] rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">{media.name || media.filename}</h3>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Price:</span>
            <span className="text-green-400 font-semibold text-lg">${media.price || '4.98'}</span>
          </div>
        </div>

        {!selectedPaymentMethod ? (
          /* Payment Method Selection */
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Choose Payment Method
            </h3>

            <div className="space-y-3">
              {/* Stripe - Credit Card */}
              <button
                onClick={() => handlePaymentMethodSelect('stripe')}
                className="w-full p-4 bg-[#2a2d34] hover:bg-[#3a3d44] rounded-lg border border-gray-600 hover:border-purple-500 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Credit/Debit Card</div>
                    <div className="text-gray-400 text-sm">Pay with Stripe</div>
                  </div>
                </div>
              </button>

              {/* PayPal */}
              <button
                onClick={() => handlePaymentMethodSelect('paypal')}
                className="w-full p-4 bg-[#2a2d34] hover:bg-[#3a3d44] rounded-lg border border-gray-600 hover:border-blue-500 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <PayPalIcon size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">PayPal</div>
                    <div className="text-gray-400 text-sm">Pay with PayPal account</div>
                  </div>
                </div>
              </button>

              {/* Cryptocurrency */}
              <button
                onClick={() => handlePaymentMethodSelect('crypto')}
                className="w-full p-4 bg-[#2a2d34] hover:bg-[#3a3d44] rounded-lg border border-gray-600 hover:border-green-500 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                    <Bitcoin className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">Cryptocurrency</div>
                    <div className="text-gray-400 text-sm">Pay with Bitcoin</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Selected Payment Method */
          <div>
            <div className="flex items-center mb-4">
              <button onClick={handleBackToOptions} className="text-gray-400 hover:text-white mr-3">
                ←
              </button>
              <h3 className="text-lg font-semibold text-white">
                {selectedPaymentMethod === 'stripe' && 'Credit/Debit Card'}
                {selectedPaymentMethod === 'paypal' && 'PayPal'}
                {selectedPaymentMethod === 'crypto' && 'Cryptocurrency'}
              </h3>
            </div>

            <div className="space-y-4">
              {selectedPaymentMethod === 'stripe' && (
                <div className="text-center">
                  <StripeCheckoutButton video={media} small={false} />
                </div>
              )}

              {selectedPaymentMethod === 'paypal' && (
                <div className="text-center">
                  <PayPalCheckoutButton video={media} small={false} />
                </div>
              )}

              {selectedPaymentMethod === 'crypto' && (
                <div className="text-center">
                  <AtlosCheckoutButton video={media} small={false} />
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleBackToOptions}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Choose different payment method
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
