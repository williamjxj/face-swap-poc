'use client'

export default function Contact() {
  return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block mb-1">Message</label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Your message..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Our information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Email</h3>
                <p>support@aigenerator.com</p>
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
              <div>
                <h3 className="font-medium">Address</h3>
                <p>123 AI Street<br />San Francisco, CA 94107</p>
              </div>
              <div>
                <h3 className="font-medium">Business hours</h3>
                <p>Monday - Friday<br />9:00 AM - 5:00 PM PST</p>
              </div>
            </div>
          </div>
        </div>
      </main>
  )
}
