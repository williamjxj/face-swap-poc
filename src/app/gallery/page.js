'use client'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function GalleryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-grow p-10">
        <div className="max-w-4xl mx-auto">
          <div className="mt-8 p-10 text-center">
            <h2 className="text-xl font-medium mb-4">Your Generated Images will appear here</h2>
            <p className="text-gray-600">You can view and download your generated images.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
