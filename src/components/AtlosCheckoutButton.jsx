'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Bitcoin } from 'lucide-react'
import { generateOrderId } from '@/lib/atlos'
import { PRICING_CONFIG } from '@/config/pricing'

// Simplified version focusing on core functionality
export default function AtlosCheckoutButton({ video, disabled = false, small = false }) {
  // Pre-initialization script to patch Atlos behavior
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Prevent WalletConnect image loading errors by blocking certain requests
      const originalFetch = window.fetch
      window.fetch = function (url, options) {
        if (typeof url === 'string' && url.includes('walletconnect.com')) {
          console.log('Blocked WalletConnect request:', url)
          return Promise.resolve(
            new Response(
              JSON.stringify({
                error: 'WalletConnect disabled',
              })
            )
          )
        }
        return originalFetch.apply(this, arguments)
      }

      // Return cleanup function
      return () => {
        window.fetch = originalFetch
      }
    }
  }, [])
  const [isAtlosLoaded, setIsAtlosLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [orderId] = useState(() => generateOrderId())

  // Handle Atlos payment success
  const handleSuccess = result => {
    console.log('Atlos payment success:', result)
    window.location.href = `/api/atlos/success?video_id=${video.id}&order_id=${orderId}&status=success`
  }

  // Handle Atlos payment canceled
  const handleCanceled = result => {
    console.log('Atlos payment canceled:', result)
    setIsLoading(false)
    window.location.href = `/face-fusion?tab=history&paymentFailed=true`
  }

  // Initialize Atlos payment
  const handleAtlosPayment = () => {
    if (!window.atlos) {
      console.error('Atlos is not loaded yet')
      return
    }

    setIsLoading(true)

    try {
      const baseUrl = window.location.origin
      const merchantId = process.env.NEXT_PUBLIC_ATLOS_MERCHANT_ID || 'WQRZ5YBYNX'

      // BTC-only configuration to avoid WalletConnect issues
      const paymentConfig = {
        merchantId: merchantId,
        orderId: orderId,
        orderAmount: video.price || PRICING_CONFIG.getPrice('crypto'),
        orderCurrency: PRICING_CONFIG.CURRENCY,
        // BTC-only to completely avoid WalletConnect
        acceptedCoins: ['BTC'],
        paymentCoins: ['BTC'],
        cryptoProtocol: 'BTC', // Force BTC protocol only
        cryptoCurrency: 'BTC',
        preferredCoin: 'BTC',
        disableWalletConnect: true, // Try explicit disabling
        useWalletConnect: false,
        testMode: true,
        redirectUrl: `${baseUrl}/api/atlos/success?video_id=${video.id}&order_id=${orderId}&status=success`,
        cancelUrl: `${baseUrl}/face-fusion?tab=history&paymentFailed=true`,
        metadata: { videoId: video.id },
        onSuccess: handleSuccess,
        onCanceled: handleCanceled,
        onError: error => console.error('Atlos error:', error),
      }

      console.log('Starting Atlos payment with config:', paymentConfig)

      // Initialize payment
      window.atlos.Pay(paymentConfig)
    } catch (error) {
      console.error('Error initializing Atlos payment:', error)
      setIsLoading(false)
    }
  }

  // Handle script load
  const handleScriptLoad = () => {
    console.log('Atlos script loaded')
    setIsAtlosLoaded(true)
  }

  return (
    <div className="atlos-payment">
      <Script
        src="https://atlos.io/packages/app/atlos.js?v=1.0.1"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />

      {small ? (
        <button
          onClick={e => {
            e.stopPropagation()
            handleAtlosPayment()
          }}
          disabled={!isAtlosLoaded || isLoading || disabled}
          className={`p-1 bg-green-500 hover:bg-green-600 rounded transition-colors ${
            !isAtlosLoaded || isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Pay with Crypto"
        >
          <Bitcoin className="w-4 h-4 text-white" />
        </button>
      ) : (
        <button
          onClick={handleAtlosPayment}
          disabled={!isAtlosLoaded || isLoading || disabled}
          className={`flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-md cursor-pointer transition duration-150 ease-in-out ${
            !isAtlosLoaded || isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Bitcoin className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'Pay with Crypto'}
        </button>
      )}
    </div>
  )
}
