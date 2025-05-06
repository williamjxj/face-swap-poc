import { NextResponse } from 'next/server'
import 'dotenv/config'

export async function POST(request) {
  try {
    const { prompt, style } = await request.json()

    if (!prompt || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const response = await fetch(process.env.NEXT_PUBLIC_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${error}`)
    }

    const data = await response.json()
    if (!data.url) {
      throw new Error('Invalid response format: missing image URL')
    }
    return NextResponse.json({ 
      url: data.url,
      id: data.id,
      purchased: data.purchased,
      timestamp: new Date().toISOString(),
      prompt 
    })
    
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
