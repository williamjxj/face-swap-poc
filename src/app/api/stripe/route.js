import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'

export async function POST(request) {
  try {
    const { priceId, name, description, amount, currency, imageId, videoId } = await request.json()

    // Validate required fields based on whether using price ID or custom pricing
    if (priceId) {
      // Using Stripe Price ID - only need priceId and videoId
      if (!priceId || !videoId) {
        return NextResponse.json({ error: 'Missing priceId or videoId' }, { status: 400 })
      }
    } else {
      // Using custom pricing - need all pricing details
      if (!name || !description || !amount || !currency) {
        return NextResponse.json({ error: 'Missing required session details' }, { status: 400 })
      }
    }

    // Get the base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_BASE_URL environment variable' },
        { status: 500 }
      )
    }

    // Create session configuration based on whether using price ID or custom pricing
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${baseUrl}/api/payment/success?session_id={CHECKOUT_SESSION_ID}&method=stripe&video_id=${videoId}`,
      cancel_url: `${baseUrl}/gallery`,
      metadata: {
        imageId: imageId || '',
        videoId: videoId || '',
      },
    }

    if (priceId) {
      // Using Stripe Price ID from dashboard
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    } else {
      // Using custom pricing (fallback)
      sessionConfig.line_items = [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: name,
              description: description,
              // Removed images to avoid URL validation error
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe session' },
      { status: 500 }
    )
  }
}
