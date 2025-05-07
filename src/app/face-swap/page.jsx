'use client'

import Image from "next/image"
import { Info, Plus, Menu, ArrowLeftRight } from "lucide-react"
import { useState, useEffect } from "react"

export default function FaceSwapPage() {
  const [selectedTab, setSelectedTab] = useState('video')
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [sourceFace, setSourceFace] = useState(null)
  const [replacementFace, setReplacementFace] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const videoTargets = [
    { 
      id: 1, 
      videoPath: '/videos/1.mp4', 
      thumbnail: '/thumbnails/1_thumbnail.webp',
      duration: '0:05',
      author: 'demo'
    },
    { 
      id: 2, 
      videoPath: '/videos/2.mp4', 
      thumbnail: '/thumbnails/2_thumbnail.webp',
      duration: '0:05',
      author: 'demo'
    },
    { 
      id: 3, 
      videoPath: '/videos/3.mp4', 
      thumbnail: '/thumbnails/3_thumbnail.webp',
      duration: '0:15',
      author: 'demo'
     },
    { 
      id: 4, 
      videoPath: '/videos/4.mp4', 
      thumbnail: '/thumbnails/4_thumbnail.webp',
      duration: '0:15',
      author: 'demo'
    },
    { 
      id: 5, 
      videoPath: '/videos/5.mp4', 
      thumbnail: '/thumbnails/5_thumbnail.webp',
      duration: '0:15',
      author: 'demo'
    }
  ]

  const ImageSources = [
    { id: 1, imagePath: '/sources/1.png' },
    { id: 2, imagePath: '/sources/2.png' }
  ];
  
 
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'video':
        return (
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
            <div className="aspect-video bg-[#2a2d34] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a3d44] transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Upload Video</span>
            </div>
            
            {videoTargets.map((video, index) => (
              <div 
                key={index} 
                className={`item-box cursor-pointer ${selectedTarget?.src === video.src ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleTargetSelect(video)}
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
                    Use Video
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

  const handleTargetSelect = (target) => {
    setSelectedTarget(target)
  }

  const handleSourceFaceUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setSourceFace({
        file: file,
        preview: objectUrl,
        name: file.name
      });
    }
  };

  // Cleanup function to revoke object URLs when component unmounts or source face changes
  useEffect(() => {
    return () => {
      if (sourceFace?.preview && typeof sourceFace.preview === 'string' && !sourceFace.preview.startsWith('/')) {
        URL.revokeObjectURL(sourceFace.preview);
      }
    };
  }, [sourceFace]);

  const handleImageSourceSelect = (image) => {
    setSourceFace({
      preview: image.imagePath,
      name: image.imagePath
    });
  };

  const handleReplacementFaceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setReplacementFace(file)
    }
  }

  const handleFaceSwap = async () => {
    if (!sourceFace || !replacementFace || !selectedTarget) {
      return
    }

    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      // Combine source and replacement into one image (simplified example)
      const combinedFace = sourceFace // In real app, would merge faces

      const formData = new FormData()
      formData.append('source', combinedFace)
      formData.append('target', selectedTarget.src)

      // Create task
      const createRes = await fetch('/api/face-fusion', {
        method: 'POST',
        body: formData,
      })

      if (!createRes.ok) {
        const error = await createRes.text()
        throw new Error(`Create task failed: ${error}`)
      }

      const { output_path } = await createRes.json()

      // Poll task status
      let attempts = 0
      const maxAttempts = 20
      let resultFile = null

      while (attempts < maxAttempts && !resultFile) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        const queryRes = await fetch('/api/face-fusion/status/' + output_path)
        setProgress(Math.min(100, (attempts / maxAttempts) * 100))

        if (queryRes.ok) {
          const data = await queryRes.json()
          if (data.status === 'completed') {
            resultFile = data.file
            setResult(data)
            break
          }
        } else if ([400, 404, 500].includes(queryRes.status)) {
          const error = await queryRes.json()
          throw new Error(`API Error: ${error.message}`)
        }

        attempts++
      }

      if (!resultFile) {
        throw new Error('Processing timeout - task not completed within allowed time')
      }
    } catch (error) {
      console.error('Face fusion error:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex h-screen p-4 gap-4 bg-[#0e1117] text-white">
      {/* Left side - Video Templates */}
      <div className="w-1/4 bg-[#1a1d24] p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Video Templates</h2>
        <div className="grid grid-cols-2 gap-2">
          {videoTargets.map((video) => (
            <div 
              key={video.id}
              className={`cursor-pointer border-2 ${selectedTarget?.id === video.id ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => setSelectedTarget(video)}
            >
              <Image
                src={video.thumbnail}
                alt={`Video ${video.id}`}
                width={116}
                height={176}
                className="w-full h-auto target-dimensions"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Middle - Video Preview */}
      <div className="flex-1 bg-[#1a1d24] flex items-center justify-center rounded-lg relative">
        {selectedTarget ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={selectedTarget.videoPath}
              controls
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        ) : (
          <div className="text-center p-6 bg-[#2a2d34] rounded-lg">
            <p className="text-gray-400 mb-4">Select a video template to preview</p>
          </div>
        )}
      </div>

      {/* Right side - Face Selection */}
      <div className="w-1/4 bg-[#1a1d24] p-4 rounded-lg flex flex-col">
        {/* Face Swap Preview Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Face Selection</h2>
          <div className="flex gap-4 justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
              {selectedTarget && (
                <Image
                  src={selectedTarget.thumbnail}
                  alt="Target"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
              {sourceFace ? (
                <Image 
                  src={sourceFace.preview || sourceFace.name}  // Use preview URL for uploaded files or image path for predefined sources
                  alt="Source face"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2d34] flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Source Images Section */}
        <div className="flex-grow">
          <h2 className="text-lg font-bold mb-4">Source Images</h2>
          <div className="grid grid-cols-3 gap-2">
            {/* Upload button */}
            <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#2a2d34]">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleSourceFaceUpload}
              />
              <Plus className="w-6 h-6 text-gray-400" />
            </label>
            
            {/* Source images */}
            {ImageSources.map((image) => (
              <div 
                key={image.id}
                className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 ${
                  sourceFace?.name === image.imagePath ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => handleImageSourceSelect(image)}
              >
                <Image 
                  src={image.imagePath}
                  alt={`Source ${image.id}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleFaceSwap}
          disabled={!sourceFace || !selectedTarget || processing}
          className={`mt-4 py-2 px-4 rounded ${
            sourceFace && selectedTarget && !processing
              ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
              : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
          }`}
        >
          {processing ? 'Processing...' : 'Start Face Swap'}
        </button>

        {processing && (
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg mt-4">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-lg mt-4">
            Success! Result saved as {result.file}
          </div>
        )}
      </div>
    </div>
  )
}
