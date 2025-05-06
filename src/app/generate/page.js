'use client'
import React, { useState } from 'react'
import { FaMagic } from 'react-icons/fa'
import Loading from '../../components/Loading'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('oil-painting')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageMetadata, setImageMetadata] = useState(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
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
        throw new Error('Failed to generate image')
      }

      const { url, id, purchased } = await response.json()
      setGeneratedImage(url)
      setImageMetadata({ id, purchased })
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCheckout = async () => {
    if (!imageMetadata?.id) return
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: imageMetadata.id,
          imageUrl: generatedImage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to initiate checkout. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-grow p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-10 mt-2">
          <div>
            <div className="mb-8">
              <label className="block text-xl mb-2 font-semibold text-gray-800" htmlFor="prompt">
                Describe your image
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="A serene lake at sunset with mountains in the background..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="mb-8">
              <label className="block text-xl mb-2" htmlFor="style">
                Art Style
              </label>
              <select
                id="style"
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {/* <option value="">Select a style</option>
                <option value="realistic">Realistic</option>
                <option value="anime">Anime</option>
                <option value="digital-art">Digital Art</option> */}
                <option value="oil-painting">Oil Painting</option>
                {/* <option value="watercolor">Watercolor</option> */}
              </select>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                className="px-4 py-2 bg-gray-300 rounded text-black w-full"
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
              >
                {isGenerating ? (
                  <Loading />
                ) : (
                  <span className="flex items-center justify-center gap-2 w-full">
                    <FaMagic />
                    Generate Image
                  </span>
                )}
              </button>
              <button
                className="px-4 py-2 bg-white border border-gray-300 rounded flex items-center gap-2 w-full justify-center"
                onClick={handleCheckout}
                disabled={!generatedImage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Checkout
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center p-16 min-h-[500px]">
            {generatedImage ? (
              <Image 
                src={generatedImage}
                alt="Generated image"
                width={512}
                height={512}
                className="max-w-full max-h-full object-contain"
                unoptimized={true}
              />
            ) : (
              <div className="text-gray-500">
                Your generated image will appear here
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
