import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { imageId, imageUrl } = await request.json()
    
    const response = await fetch(process.env.NEXT_PUBLIC_CHECKOUT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        imageUrl
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Payment API Error: ${error}`)
    }

    const { url: checkoutUrl } = await response.json()
    if (!checkoutUrl) {
      throw new Error('Invalid response format: missing checkout URL')
    }

    return NextResponse.json({ checkoutUrl })
    
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
