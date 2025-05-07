'use client'

import Image from "next/image"
import { Info, Plus, Menu, ArrowLeftRight } from "lucide-react"
import { useState } from "react"

export default function FaceSwapPage() {
  const [selectedTab, setSelectedTab] = useState('video')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [sourceFace, setSourceFace] = useState(null)
  const [targetFace, setTargetFace] = useState(null)

  const videoSources = [
    {
      src: '/videos/1.mp4',
      duration: '0:05',
      author: 'demo'
    },
    {
      src: '/videos/2.mp4',
      duration: '0:05',
      author: 'demo'
    },
    {
      src: '/videos/3.mp4',
      duration: '0:15',
      author: 'demo'
    },
    {
      src: '/videos/4.mp4',
      duration: '0:15',
      author: 'demo'
    },
    {
      src: '/videos/5.mp4',
      duration: '0:15',
      author: 'demo'
    }
  ]

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'video':
        return (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="aspect-video bg-[#2a2d34] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Upload Video</span>
            </div>
            
            {videoSources.map((video, index) => (
              <div 
                key={index} 
                className={`item-box cursor-pointer ${selectedTemplate?.src === video.src ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleTemplateSelect(video)}
              >
                <div className="duration">{video.duration}</div>
                <video
                  src={video.src}
                  className="material"
                  muted
                  loop
                  onMouseOver={(e) => e.target.play()}
                  onMouseOut={(e) => e.target.pause()}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'image':
        return (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="aspect-square bg-[#2a2d34] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Upload Image</span>
            </div>
          </div>
        );
      case 'gif':
        return (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="aspect-square bg-[#2a2d34] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Upload GIF</span>
            </div>
          </div>
        );
      case 'multi-face':
        return (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="aspect-square bg-[#2a2d34] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Multi-face Swap</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
  }

  const handleSourceFaceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSourceFace(file)
    }
  }

  const handleTargetFaceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setTargetFace(file)
    }
  }

  const handleFaceSwap = async () => {
    if (!sourceFace || !targetFace || !selectedTemplate) {
      return
    }

    const formData = new FormData()
    formData.append('source', sourceFace)
    formData.append('target', targetFace)
    formData.append('template', selectedTemplate.src)

    try {
      const response = await fetch('/api/face-swap', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      // Handle response...
    } catch (error) {
      console.error('Face swap error:', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0e1117] text-white">
      <div className="flex-1 flex">
        {/* Left sidebar */}
        <div className="hidden md:flex flex-col w-[300px] border-r border-gray-800 bg-[#1a1d24]">
          <div className="flex border-b border-gray-800">
            {['video', 'image', 'gif', 'multi-face'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize ${
                  selectedTab === tab
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {renderTabContent()}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-[#1a1d24] p-6">
          <div className="max-w-4xl mx-auto w-full">
            {/* Mobile tabs */}
            <div className="md:hidden flex overflow-x-auto mb-6 bg-[#2a2d34] rounded-lg">
              {['video', 'image', 'gif', 'multi-face'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap capitalize ${
                    selectedTab === tab
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Upload area */}
            <div className="aspect-video bg-[#2a2d34] rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                  <ArrowLeftRight className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">AI Face Swap</h3>
                  <p className="text-sm text-gray-400">Drag and drop or click to upload your video/image</p>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm transition-colors">
                  Upload File
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#2a2d34] p-6 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-500 font-medium">1</span>
                </div>
                <h4 className="font-medium mb-2">Upload Source</h4>
                <p className="text-sm text-gray-400">Upload your video or image that you want to modify</p>
              </div>
              <div className="bg-[#2a2d34] p-6 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-500 font-medium">2</span>
                </div>
                <h4 className="font-medium mb-2">Select Faces</h4>
                <p className="text-sm text-gray-400">Choose the faces you want to swap in your content</p>
              </div>
              <div className="bg-[#2a2d34] p-6 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-500 font-medium">3</span>
                </div>
                <h4 className="font-medium mb-2">Generate</h4>
                <p className="text-sm text-gray-400">Click generate and wait for your face-swapped content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:flex flex-col w-[280px] border-l border-gray-800 bg-[#1a1d24] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium">Face Selection</h3>
            <button className="text-sm text-blue-500 hover:text-blue-400">History</button>
          </div>

          <div className="space-y-6">
            {/* Source face */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Source Face</p>
              <label className="aspect-square w-full rounded-full bg-[#2a2d34] flex items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
                {sourceFace ? (
                  <img 
                    src={URL.createObjectURL(sourceFace)} 
                    alt="Source face" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Plus className="w-8 h-8 text-gray-400" />
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleSourceFaceUpload}
                />
              </label>
            </div>

            {/* Target face */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Target Face</p>
              <label className="aspect-square w-full rounded-full bg-[#2a2d34] flex items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
                {targetFace ? (
                  <img 
                    src={URL.createObjectURL(targetFace)} 
                    alt="Target face" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Plus className="w-8 h-8 text-gray-400" />
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleTargetFaceUpload}
                />
              </label>
            </div>

            <button 
              onClick={handleFaceSwap}
              disabled={!sourceFace || !targetFace || !selectedTemplate}
              className={`w-full py-3 rounded-lg ${
                sourceFace && targetFace && selectedTemplate
                  ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                  : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
              }`}
            >
              {sourceFace && targetFace && selectedTemplate ? 'Start Face Swap' : 'Select Faces to Start'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
