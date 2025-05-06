import Image from "next/image"
import { Info, Plus, Menu } from "lucide-react"

export default function FaceSwapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0e1117] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-800">
        <div className="flex items-center">
          <div className="mr-4 md:mr-8">
            {/* Logo - replace with your actual logo */}
            <Image src="/placeholder.svg?height=32&width=120" alt="SEAART.AI" width={120} height={32} className="h-8" />
          </div>
          <nav className="hidden md:flex space-x-6">
            <div className="flex items-center space-x-1 cursor-pointer">
              <span>Explore</span>
              <span className="text-xs">▼</span>
            </div>
            <div className="flex items-center space-x-1 cursor-pointer">
              <span>Quick AI</span>
              <span className="text-xs">▼</span>
            </div>
            <div className="cursor-pointer">Training</div>
          </nav>
        </div>
        {/* Mobile menu button - using standard button instead of shadcn Button */}
        <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left sidebar - hidden on mobile, shown on md and up */}
        <div className="hidden md:block md:w-[250px] lg:w-[300px] border-r border-gray-800">
          <div className="flex border-b border-gray-800 overflow-x-auto">
            <button className="px-4 md:px-6 py-3 text-sm border-b-2 border-blue-500 whitespace-nowrap">Video</button>
            <button className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">Image</button>
            <button className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">Gif</button>
            <button className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">Multi-Face</button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Template thumbnails */}
            <div className="w-full aspect-square bg-[#1a1d24] rounded flex flex-col items-center justify-center cursor-pointer">
              <Plus className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs text-gray-400">Custom Template</span>
              <Info className="w-4 h-4 text-gray-500 mt-1" />
            </div>

            {/* Placeholder template thumbnails */}
            <div className="w-full aspect-square rounded overflow-hidden">
              <Image
                src="/placeholder.svg?height=150&width=150&text=Template+1"
                alt="Template 1"
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full aspect-square rounded overflow-hidden">
              <Image
                src="/placeholder.svg?height=150&width=150&text=Template+2"
                alt="Template 2"
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full aspect-square rounded overflow-hidden">
              <Image
                src="/placeholder.svg?height=150&width=150&text=Template+3"
                alt="Template 3"
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Mobile tabs - visible only on small screens */}
        <div className="md:hidden flex border-b border-gray-800 overflow-x-auto">
          <button className="px-4 py-3 text-sm border-b-2 border-blue-500 whitespace-nowrap">Video</button>
          <button className="px-4 py-3 text-sm whitespace-nowrap">Image</button>
          <button className="px-4 py-3 text-sm whitespace-nowrap">Gif</button>
          <button className="px-4 py-3 text-sm whitespace-nowrap">Multi-Face</button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center pt-6 md:pt-10 pb-6 px-4">
          <div className="mb-2">
            <Image
              src="/placeholder.svg?height=64&width=64&text=AI"
              alt="Face swap icon"
              width={64}
              height={64}
              className="h-12 w-12 md:h-16 md:w-16"
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">AI Face Swap</h1>
          <div className="flex items-center text-xs md:text-sm text-gray-400 mb-6 md:mb-8">
            <span>Supports video face swapping</span>
            <Info className="w-4 h-4 ml-1" />
          </div>

          {/* Upload area */}
          <div className="w-full max-w-[720px] h-[250px] md:h-[350px] lg:h-[450px] border border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center bg-[#1a1d24]">
            <div className="text-center text-gray-400 text-sm md:text-base px-4">
              <p className="mb-1">Step 1: Select template for preview</p>
              <p>Step 2: Add face on the right, then proceed</p>
            </div>
          </div>

          {/* Mobile face selection - only visible on small screens */}
          <div className="md:hidden mt-6 w-full">
            <p className="text-sm mb-3">Select Face</p>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Face"
                  alt="Face 1"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Face"
                  alt="Face 2"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Create button */}
          <div className="mt-auto w-full max-w-[720px]">
            <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition">
              Create
            </button>
          </div>
        </div>

        {/* Right sidebar - hidden on mobile, shown on md and up */}
        <div className="hidden md:block md:w-[200px] lg:w-[250px] border-l border-gray-800 p-4">
          <div className="flex justify-between items-center mb-4">
            <button className="px-4 py-1 bg-blue-500 rounded-full text-sm">Swap</button>
            <button className="text-sm text-gray-400">History</button>
          </div>

          <div className="mb-6">
            <p className="text-sm mb-3">Process</p>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Source"
                  alt="Source face"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-[2px] flex-1 bg-gray-700 mx-2"></div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Target"
                  alt="Target face"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm mb-3">Select Face</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="w-full aspect-square rounded-full flex items-center justify-center bg-gray-700">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <div className="w-full aspect-square rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Face"
                  alt="Face 1"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-full aspect-square rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Face"
                  alt="Face 2"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-full aspect-square rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=48&width=48&text=Face"
                  alt="Face 3"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
