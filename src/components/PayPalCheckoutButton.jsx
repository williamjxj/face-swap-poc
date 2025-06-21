'use client'

import { useState } from 'react'
import Script from 'next/script'
import { PRICING_CONFIG } from '@/config/pricing'
import { useToast } from '@/contexts/ToastContext'

// PayPal icon component
const PayPalIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.394.45.67.96.824 1.517z" />
  </svg>
)

export default function PayPalCheckoutButton({ video, small = false }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPayPalLoaded, setIsPayPalLoaded] = useState(false)
  const toast = useToast()

  const handlePayPalPayment = async () => {
    if (!window.paypal) {
      toast.warning('PayPal is not loaded yet. Please try again.')
      return
    }

    setIsLoading(true)

    try {
      // Create a container for PayPal buttons
      const container = document.getElementById('paypal-button-container')
      if (container) {
        container.innerHTML = '' // Clear any existing buttons
      }

      // Render PayPal buttons
      window.paypal
        .Buttons({
          createOrder: (_, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: video.price || PRICING_CONFIG.getPrice('paypal'),
                    currency_code: PRICING_CONFIG.CURRENCY,
                  },
                  description: `Video: ${video.name || video.filename}`,
                  custom_id: video.id,
                },
              ],
            })
          },
          onApprove: (data, actions) => {
            return actions.order.capture().then(details => {
              console.log('PayPal payment successful:', details)
              // Redirect to success page
              window.location.href = `/api/payment/success?paypal_order_id=${data.orderID}&method=paypal&video_id=${video.id}`
            })
          },
          onError: err => {
            console.error('PayPal payment error:', err)
            setIsLoading(false)
            toast.error('PayPal payment failed. Please try again.')
          },
          onCancel: () => {
            console.log('PayPal payment cancelled')
            setIsLoading(false)
          },
        })
        .render('#paypal-button-container')
    } catch (error) {
      console.error('Error initializing PayPal:', error)
      setIsLoading(false)
      toast.error('Failed to initialize PayPal. Please try again.')
    }
  }

  // Handle PayPal script load
  const handlePayPalScriptLoad = () => {
    console.log('PayPal SDK loaded successfully')
    setIsPayPalLoaded(true)
  }

  if (small) {
    return (
      <button
        onClick={e => {
          e.stopPropagation()
          handlePayPalPayment()
        }}
        disabled={!isPayPalLoaded || isLoading}
        className={`p-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors ${
          !isPayPalLoaded || isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Pay with PayPal"
      >
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
          onLoad={handlePayPalScriptLoad}
          strategy="lazyOnload"
        />
        <PayPalIcon size={16} />
        <div id="paypal-button-container" className="hidden"></div>
      </button>
    )
  }

  return (
    <div className="paypal-payment">
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
        onLoad={handlePayPalScriptLoad}
        strategy="lazyOnload"
      />

      <button
        onClick={handlePayPalPayment}
        disabled={!isPayPalLoaded || isLoading}
        className={`flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md cursor-pointer transition duration-150 ease-in-out ${
          !isPayPalLoaded || isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <PayPalIcon size={16} />
        {isLoading ? 'Processing...' : 'Pay with PayPal'}
      </button>

      <div id="paypal-button-container" className="mt-2"></div>
    </div>
  )
}
