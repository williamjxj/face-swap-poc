'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard } from 'lucide-react'
import { PRICING_CONFIG } from '@/config/pricing'

// Initialize Stripe outside the component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function StripeCheckoutButton({ video, disabled = false, small = false }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStripeCheckout = async () => {
    setIsLoading(true)
    try {
      const stripe = await stripePromise

      if (!stripe) {
        console.error('Stripe failed to initialize')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use Stripe Price ID if available, otherwise use custom pricing
          ...(PRICING_CONFIG.isUsingStripePriceId()
            ? { priceId: PRICING_CONFIG.getStripePriceId() }
            : {
                name: `Video: ${video.name}`,
                description: 'Purchase video content',
                amount: video.price || PRICING_CONFIG.getPrice('stripe'),
                currency: PRICING_CONFIG.CURRENCY,
              }),
          imageId: video.name,
          // Include the video id to use in webhook
          videoId: video.id,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        console.error('Error creating Stripe session:', error)
        setIsLoading(false)
        return
      }

      // Redirect to Stripe checkout
      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId })

      if (redirectError) {
        console.error('Error redirecting to Stripe:', redirectError)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      setIsLoading(false)
    }
  }

  if (small) {
    return (
      <button
        onClick={e => {
          e.stopPropagation()
          handleStripeCheckout()
        }}
        disabled={isLoading || disabled}
        className={`p-1 bg-purple-500 hover:bg-purple-600 rounded transition-colors ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Pay with Card"
      >
        <CreditCard className="w-4 h-4 text-white" />
      </button>
    )
  }

  return (
    <button
      onClick={handleStripeCheckout}
      disabled={isLoading || disabled}
      className={`flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-md cursor-pointer transition duration-150 ease-in-out ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <CreditCard className="w-4 h-4" />
      {isLoading ? 'Processing...' : 'Pay with Card'}
    </button>
  )
}
