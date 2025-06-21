export const metadata = {
  title: 'Video Carousel Demo - Face Swap App',
  description: 'Interactive video carousel component demonstration with navigation and controls',
}

export default function VideoCarouselLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {children}
    </div>
  )
}
