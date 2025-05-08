'use client'

import Image from "next/image"
import { Info, Plus, Menu, ArrowLeftRight } from "lucide-react"
import { useState, useEffect } from "react"
import VideoModal from "../../components/VideoModal"
import styles from './page.module.css'

export default function FaceSwapPage() {
  const [selectedTab, setSelectedTab] = useState('video')
  const [rightSideTab, setRightSideTab] = useState('face-swap')
  // Store just the paths as strings for form data
  const [targetPath, setTargetPath] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)
  // Keep preview states separate for UI
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [imageSources, setImageSources] = useState([])

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

  const tabOptions = [
    { id: 'video', label: 'Video' },
    { id: 'image', label: 'Image' },
    { id: 'gif', label: 'GIF' },
    { id: 'multi-face', label: 'Multi-face' }
  ]


  // Load generated videos when component mounts
  useEffect(() => {
    const loadGeneratedVideos = async () => {
      try {
        // List files in the outputs directory
        const response = await fetch('/api/list-outputs')
        const data = await response.json()
        
        if (data.files) {
          // Sort by creation time descending
          const sortedVideos = data.files
            .map(file => ({
              url: `/outputs/${file.name}`,
              name: file.name,
              createdAt: file.createdAt
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
            
          setGeneratedVideos(sortedVideos)
        }
      } catch (error) {
        console.error('Error loading generated videos:', error)
      }
    }

    loadGeneratedVideos()
  }, [result]) // Reload when new video is generated

   // Load image sources from API
   useEffect(() => {
    const loadImageSources = async () => {
      try {
        const response = await fetch('/api/list-sources')
        const data = await response.json()

        if (data.files) {
          const sources = data.files.map(file => ({
            id: file.id,
            name: file.name,
            imagePath: file.imagePath,
          }))
          setImageSources(sources)
        }
      } catch (error) {
        console.error('Error loading image sources:', error)
      }
    }

    loadImageSources()
  }, [])


  const renderTabContent = () => {
    switch (selectedTab) {
      case 'video':
        return (
          <div className="w-full bg-[#1a1d24] p-2 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {videoTargets.map((video) => (
                <div 
                  key={video.id}
                  className={`cursor-pointer border-2 relative ${selectedTarget?.id === video.id ? 'border-blue-500' : 'border-transparent'}`}
                  style={{
                    background: '#2b2c32',
                    "border-radius": '12px',
                    cursor: 'pointer',
                  }}
                  onClick={handleTargetSelect.bind(null, video)}
                >
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full text-xs text-white z-10">
                    {video.duration}
                  </div>
                  <Image
                    src={video.thumbnail}
                    alt={`Video ${video.id}`}
                    width={116}
                    height={176}
                    className="w-full h-[176px] object-cover"
                  />
                </div>
              ))}
            </div>
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
    setTargetPath(target.videoPath)
  }

  const handleSourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload file to server
        const response = await fetch('/api/upload-source', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const sourcePath = `/sources/${data.filename}`;
        
        setSelectedSource({
          preview: sourcePath,
          name: sourcePath
        });
        setSourcePath(sourcePath);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError('Failed to upload image');
      }
    }
  };

  const handleSourceSelect = (image) => {
    setSelectedSource({
      preview: image.imagePath,
      name: image.name
    });
    setSourcePath(image.imagePath);
  };

  const handleSubmit = async () => {
    if (!sourcePath || !targetPath) {
      return
    }

    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      // Submit form data
      const response = await fetch('/api/face-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourcePath,
          target: targetPath
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Face swap failed: ${error}`)
      }

      const generatedVideo = await response.json()
      setResult(generatedVideo)
      setRightSideTab('history') // Switch to history tab after successful generation
    } catch (error) {
      console.error('Face swap error:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
  }

  const handleDownload = async (video) => {
    const link = document.createElement('a')
    link.href = video.url
    link.download = video.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (video) => {
    try {
      const response = await fetch('/api/delete-output', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: video.name })
      })

      if (response.ok) {
        setGeneratedVideos(videos => videos.filter(v => v.name !== video.name))
        setSelectedVideo(null)
      }
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }


  return (
    <div className="flex h-screen p-4 gap-4 bg-[#0e1117] text-white">
      {/* Left side - Video Templates */}
      <div className="w-1/4 bg-[#1a1d24] rounded-lg flex flex-col">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex space-x-2">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:bg-[#2a2d34]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
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

      {/* Right side - Face Selection and History */}
      <div className="w-1/4 bg-[#1a1d24] rounded-lg flex flex-col">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setRightSideTab('face-swap')}
              className={`px-3 py-2 rounded-lg text-sm ${
                rightSideTab === 'face-swap'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:bg-[#2a2d34]'
              }`}
            >
              Face Swap
            </button>
            <button
              onClick={() => setRightSideTab('history')}
              className={`px-3 py-2 rounded-lg text-sm ${
                rightSideTab === 'history'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:bg-[#2a2d34]'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {rightSideTab === 'face-swap' ? (
            <div className="p-4">
              {/* Face Swap Content */}
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">Face Selection</h2>
                <div className="flex gap-4 justify-center relative">
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
                  <div className={styles.connecting_line}></div>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                    {selectedSource ? (
                      <Image 
                        src={selectedSource.preview}
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
                      onChange={handleSourceUpload}
                    />
                    <Plus className="w-6 h-6 text-gray-400" />
                  </label>
                  
                  {/* Source images */}
                  {imageSources.map((image) => (
                    <div 
                      key={image.id}
                      className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 ${
                        selectedSource?.name === image.name ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => handleSourceSelect(image)}
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
                onClick={handleSubmit}
                disabled={!selectedSource || !selectedTarget || processing}
                className={`mt-4 py-2 px-4 rounded w-full ${
                  selectedSource && selectedTarget && !processing
                    ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
                }`}
              >
                {processing ? 'Processing...' : 'Generate'}
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
          ) : (
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">Generated Videos</h2>
              <div className="grid gap-4">
                {generatedVideos.map((video) => (
                  <div 
                    key={video.name}
                    className="bg-[#2a2d34] p-3 rounded-lg cursor-pointer hover:bg-[#3a3d44] transition-colors"
                    onClick={() => handleVideoClick(video)}
                  >
                    <video
                      src={video.url}
                      className="w-full rounded-lg mb-2"
                      autoPlay
                      loop
                      muted
                      style={{ "border-radius": "8px", objectFit: "cover" }}
                    />
                    <div className="text-sm text-gray-400">
                      {video.name}: {new Date(video.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDownload={() => handleDownload(selectedVideo)}
          onDelete={() => handleDelete(selectedVideo)}
        />
      )}
    </div>
  )
}
