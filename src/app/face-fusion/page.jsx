'use client'

import Image from "next/image"
import { Info, ArrowLeftRight, Download, Lock } from "lucide-react"
import FaceSelection from "./FaceSelection"
import { useState, useEffect } from "react"
import VideoModal from "@/components/VideoModal"
import GuidelineModal from "@/components/GuidelineModal"
import Loading from "@/components/Loading"
import TabContent from "./TabContent"

export default function FaceFusion() {
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState([])
  const [imageSources, setImageSources] = useState([])
  const [videoTargets, setVideoTargets] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedFace, setSelectedFace] = useState(null)
  const [loading, setLoading] = useState(true)

  const tabOptions = [
    { id: 'video', label: 'Video' },
    { id: 'image', label: 'Image' },
    { id: 'gif', label: 'GIF' },
    { id: 'multi-face', label: 'Multi-face' }
  ]

  // Load templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to load templates');
        }
        const data = await response.json();
        setVideoTargets(data.templates);
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setSelectedTemplate(data.templates[0]);
          setSelectedFace(0); // Select first face by default
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);    // Load generated videos when component mounts
  useEffect(() => {
    const loadGeneratedVideos = async () => {
      try {
        const response = await fetch('/api/generated-media');
        if (!response.ok) {
          throw new Error('Failed to load generated videos');
        }
        const data = await response.json();
        
        if (data.files) {
          // Convert strings back to BigInt if needed
          const videos = data.files.map(video => ({
            ...video,
            fileSize: BigInt(video.fileSize || 0), // Convert back to BigInt
          }));
          setGeneratedVideos(videos);
        }
      } catch (error) {
        console.error('Error loading generated videos:', error);
        setError('Failed to load generated videos');
      }
    };

    loadGeneratedVideos();
  }, [result]); // Reload when new video is generated

   // Load image sources from API
   useEffect(() => {
    const loadImageSources = async () => {
      try {
        const response = await fetch('/api/face-sources')
        const data = await response.json()

        if (data.files) {
          const sources = data.files
            .map(file => ({
              id: file.id,
              name: file.filename,
              imagePath: file.filePath,
              createdAt: file.createdAt || 0
            }))
            .sort((a, b) => b.createdAt - a.createdAt) // Sort by creation time descending
          setImageSources(sources)
        }
      } catch (error) {
        console.error('Error loading image sources:', error)
      }
    }

    loadImageSources()
  }, [])


  const handleTargetSelect = (target) => {
    setSelectedTarget(target)
    setTargetPath(target.filePath)
  }

  const handleSourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setProcessing(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-source', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const sourcePath = `/sources/${data.filename}`;
        
        // Update both selected source and source path
        const newSource = {
          preview: sourcePath,
          name: data.filename
        };
        setSelectedSource(newSource);
        setSourcePath(sourcePath);

        // Add the new image to the beginning of imageSources
        const newImage = {
          id: Date.now(), // Use timestamp as temporary id
          name: data.filename,
          imagePath: sourcePath,
          createdAt: Date.now()
        };
        
        setImageSources(prev => [newImage, ...prev]);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError('Failed to upload image');
      } finally {
        setProcessing(false);
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
    console.log('handleSubmit: ', sourcePath, targetPath)
    
    if (!sourcePath || !targetPath) {
      return
    }

    setProcessing(true)
    setProgress(0)  // Reset progress
    setError(null)
    setResult(null)

    try {
      // Set up progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // Simulate progress up to 90% (the last 10% will be when we get the response)
          const newProgress = prevProgress + (90 - prevProgress) * 0.1;
          return Math.min(newProgress, 90);
        });
      }, 500);

      // Submit form data
      const response = await fetch('/api/face-fusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourcePath,
          target: targetPath
        })
      })

      clearInterval(progressInterval);  // Clean up interval

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Face swap failed: ${error}`)
      }

      // Set progress to 100% when complete
      setProgress(100);
      
      const generatedVideo = await response.json()
      setResult(generatedVideo)
      setRightSideTab('history') // Switch to history tab after successful generation
    } catch (error) {
      console.error('Face swap error:', error)
      setError(error.message)
      setProgress(0)  // Reset progress on error
    } finally {
      setTimeout(() => {
        setProcessing(false)
      }, 500); // Slight delay to show 100% progress
    }
  }

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
  }

  const handleDownload = async (video) => {
    if (!video.isPaid) {
      setError('Please purchase the video to download');
      return;
    }
    
    try {
      const response = await fetch(`/api/download-media?filename=${video.name}`);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = video.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      setError('Failed to download video');
    }
  }

  const handleDelete = async (video) => {
    try {
      const response = await fetch(`/api/generated-media?filename=${video.name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setGeneratedVideos(videos => videos.filter(v => v.name !== video.name));
      setSelectedVideo(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('Failed to delete video');
    }
  }

  const handleSourceDelete = async (image, e) => {
    e.stopPropagation() // Prevent triggering image selection
    try {
      const response = await fetch('/api/face-sources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: image.name })
      })

      if (response.ok) {
        // Remove from imageSources array
        setImageSources(sources => sources.filter(src => src.name !== image.name))
        // Clear selection if deleted image was selected
        if (selectedSource?.name === image.name) {
          setSelectedSource(null)
          setSourcePath(null)
        }
      }
    } catch (error) {
      console.error('Error deleting source image:', error)
    }
  }

  const handleTargetUploadWrapper = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check file size (500MB limit)
        if (file.size > 150 * 1024 * 1024) {
          setError('File size exceeds 150MB limit');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading file:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Upload failed with status:', response.status, 'Error:', errorData);
          throw new Error(`Upload failed: ${errorData}`);
        }

        const data = await response.json();
        console.log('Upload response:', data);
        
        // Create a new template object matching the database schema
        const newTemplate = {
          id: data.id,
          filename: data.filename,
          type: 'video',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize), // Convert string back to BigInt
          mimeType: data.mimeType
        };

        console.log('Created template object:', newTemplate);

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev]);
        setVideoTargets(prev => [newTemplate, ...prev]);
        
        // Select the new template
        setSelectedTemplate(newTemplate);
        setSelectedFace(0); // Reset face selection
      } catch (error) {
        console.error('Error uploading template:', error);
        setError(error.message || 'Failed to upload template');
      }
    }
  };

  const handleImageUploadWrapper = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size exceeds 10MB limit');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Upload failed: ${errorData}`);
        }

        const data = await response.json();
        
        // Create a new template object
        const newTemplate = {
          id: data.id,
          filename: data.filename,
          type: 'image',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize),
          mimeType: data.mimeType
        };

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev]);
        setVideoTargets(prev => [newTemplate, ...prev]);
        
        // Select the new template
        setSelectedTemplate(newTemplate);
        setSelectedFace(0);
      } catch (error) {
        console.error('Error uploading image:', error);
        setError(error.message || 'Failed to upload image');
      }
    }
  };

  const handleGifUploadWrapper = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          setError('File size exceeds 50MB limit');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Upload failed: ${errorData}`);
        }

        const data = await response.json();
        
        // Create a new template object
        const newTemplate = {
          id: data.id,
          filename: data.filename,
          type: 'gif',
          filePath: data.filePath,
          thumbnailPath: data.thumbnailPath,
          duration: data.duration,
          fileSize: BigInt(data.fileSize),
          mimeType: data.mimeType
        };

        // Update both templates and videoTargets
        setTemplates(prev => [newTemplate, ...prev]);
        setVideoTargets(prev => [newTemplate, ...prev]);
        
        // Select the new template
        setSelectedTemplate(newTemplate);
        setSelectedFace(0);
      } catch (error) {
        console.error('Error uploading GIF:', error);
        setError(error.message || 'Failed to upload GIF');
      }
    }
  };

  const handleMultiFaceUploadWrapper = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        // Check if any file exceeds 10MB
        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          setError('Some files exceed 10MB limit');
          return;
        }

        // Upload each file
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload-template', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Upload failed: ${errorData}`);
          }

          const data = await response.json();
          
          // Create a new template object
          const newTemplate = {
            id: data.id,
            filename: data.filename,
            type: 'image',
            filePath: data.filePath,
            thumbnailPath: data.thumbnailPath,
            duration: data.duration,
            fileSize: BigInt(data.fileSize),
            mimeType: data.mimeType
          };

          // Update both templates and videoTargets
          setTemplates(prev => [newTemplate, ...prev]);
          setVideoTargets(prev => [newTemplate, ...prev]);
        }
      } catch (error) {
        console.error('Error uploading multi-face images:', error);
        setError(error.message || 'Failed to upload multi-face images');
      }
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setTargetPath(template.filePath);
    setSelectedFace(0); // Reset face selection when template changes
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the select handler
    try {
      const response = await fetch(`/api/delete-template?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Remove from both templates and videoTargets
      setTemplates(prev => prev.filter(template => template.id !== id));
      setVideoTargets(prev => prev.filter(template => template.id !== id));
      
      // If the deleted template was selected, clear the selection
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setSelectedFace(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen gap-4 bg-[#0e1117] text-white">
      {/* Left side - Video Templates */}
      <div className="w-1/4 bg-[#1a1d24] rounded-lg flex flex-col">
        {/* Tab Navigation */}
        <div className="p-2 border-b border-gray-800">
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
          <TabContent
            selectedTab={selectedTab}
            templates={templates}
            onSelectTemplate={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
            onTargetUpload={handleTargetUploadWrapper}
            onImageUpload={handleImageUploadWrapper}
            onGifUpload={handleGifUploadWrapper}
            onMultiFaceUpload={handleMultiFaceUploadWrapper}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>
      </div>

      {/* Middle - Video Preview */}
      <div className="flex-1 bg-[#1a1d24] flex flex-col items-center rounded-lg relative p-6 pt-2 pb-2">
        <div className="flex flex-col items-center justify-center space-y-0">
          <div className="w-16 h-16 relative">
            <Image
              src={'/face.webp'}
              alt="Face Changing"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Face Swap
          </h2>
          <div className="text-gray-400 text-center mb-0">
            <span className="text-sm">Support video for face swapping</span>
          </div>
        </div>

        {selectedTemplate ? (
          <div 
            className="w-[calc(100%-160px)] h-[612px] bg-[#2a2832] rounded-[20px] border-2 border-dashed border-white/70 relative mt-[18px] flex items-center justify-center"
          >
            <div className="w-full h-full flex items-center justify-center">
              {selectedTemplate.mimeType?.startsWith('video/') ? (
                <video
                  src={selectedTemplate.filePath}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                  poster={selectedTemplate.thumbnailPath}
                />
              ) : (
                <img
                  src={selectedTemplate.filePath}
                  alt={selectedTemplate.filename}
                  className="w-full h-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        ) : (
          <div 
            className="w-[calc(100%-160px)] h-[612px] bg-[#2a2832] rounded-[20px] border-2 border-dashed border-white/70 relative mt-[18px] flex items-center justify-center"
          >
            <div className="text-center p-12 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <ArrowLeftRight className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-xl text-gray-300 font-medium">Step 1: Select a template to preview</p>
                <p className="text-xl text-gray-300 font-medium">Step 2: Add a face from the right panel, then generate</p>
              </div>
            </div>
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
              <span className="text-gray-400 ml-0">
                <Info 
                  className="inline-block ml-1 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-300" 
                  onClick={() => setIsModalOpen(true)} 
                />
              </span>
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
              <FaceSelection
                selectedTemplate={selectedTemplate}
                selectedFace={selectedFace}
                onFaceSelect={setSelectedFace}
                imageSources={imageSources}
                selectedSource={selectedSource}
                onSourceSelect={handleSourceSelect}
                onSourceUpload={handleSourceUpload}
                onSourceDelete={handleSourceDelete}
                processing={processing}
              />

              {/* Generate Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedSource || !selectedTemplate || processing}
                className={`mt-4 py-2 px-4 rounded w-full ${
                  selectedSource && selectedTemplate && !processing
                    ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    : 'bg-blue-500/50 text-white/50 cursor-not-allowed'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loading /> Processing...
                  </span>
                ) : (
                  'Generate'
                )}
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
              <h2 className="text-lg font-bold mb-4 text-white">Generated Media</h2>
              <div className="grid grid-cols-2 gap-4">
                {generatedVideos.map((media) => (
                  <div 
                    key={media.id}
                    className="bg-[#2a2d34] p-3 rounded-lg cursor-pointer hover:bg-[#3a3d44] transition-colors"
                    onClick={() => handleVideoClick(media)}
                  >
                    {media.type === 'video' ? (
                      <div className="relative">
                        <video
                          src={media.isPaid ? media.filePath : media.watermarkPath || media.filePath}
                          className="w-full h-32 rounded-lg mb-2"
                          autoPlay
                          loop
                          muted
                          style={{ "borderRadius": "8px", objectFit: "cover" }}
                        />
                        {!media.isPaid && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Lock className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={media.isPaid ? media.filePath : media.watermarkPath || media.filePath}
                        alt={media.name}
                        className="w-full h-32 rounded-lg mb-2"
                        style={{ "borderRadius": "8px", objectFit: "cover" }}
                      />
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">
                        {media.name}
                      </div>
                      {media.isPaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(media);
                          }}
                          className="p-1 hover:bg-blue-500/20 rounded"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(media.createdAt).toLocaleString()}
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

      {isModalOpen && (
        <GuidelineModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}
