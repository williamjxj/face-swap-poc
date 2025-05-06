'use client'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">How does the image generator work?</h2>
            <p className="text-gray-600">
              Our AI uses advanced machine learning models to generate images based on your text prompts. Simply describe what you want, and our system will create it.
            </p>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Is there a limit to how many images I can generate?</h2>
            <p className="text-gray-600">
              Free users can generate up to 10 images per day. Premium subscribers enjoy unlimited generations.
            </p>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Can I use the generated images commercially?</h2>
            <p className="text-gray-600">
              Yes, all images you generate are yours to use however you like, including for commercial purposes.
            </p>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">How do I delete my account?</h2>
            <p className="text-gray-600">
              You can delete your account at any time from the Profile page. This will permanently remove all your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Who do I contact for support?</h2>
            <p className="text-gray-600">
              For any questions not answered here, please visit our <a href="/contact" className="text-blue-500 hover:underline">Contact Us</a> page.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
