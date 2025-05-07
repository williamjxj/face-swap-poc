'use client';

import Image from "next/image";
import { useState } from "react";

// Sample template and face images from public directory
const TEMPLATES = [
  { id: 1, videoPath: '/videos/1.mp4', thumbnail: '/thumbnails/1_thumbnail.webp' },
  { id: 2, videoPath: '/videos/2.mp4', thumbnail: '/thumbnails/2_thumbnail.webp' },
  { id: 3, videoPath: '/videos/3.mp4', thumbnail: '/thumbnails/3_thumbnail.webp' },
  { id: 4, videoPath: '/videos/4.mp4', thumbnail: '/thumbnails/4_thumbnail.webp' },
  { id: 5, videoPath: '/videos/5.mp4', thumbnail: '/thumbnails/5_thumbnail.webp' }
];

const FACES = [
  { id: 1, imagePath: '/sources/1.png' },
  { id: 2, imagePath: '/sources/2.png' }
];

const FaceSwapPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFace, setSelectedFace] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setPreviewImage(template.videoPath);
  };

  const handleFaceClick = (face) => {
    setSelectedFace(face);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage({ 
        id: 'uploaded', 
        imagePath: imageUrl,
        file: file // Store the actual file object
      });
      setSelectedFace({ 
        id: 'uploaded', 
        imagePath: imageUrl,
        file: file
      });
    }
  };

  const handleGenerateClick = async () => {
    if (!selectedTemplate || !selectedFace) return;

    try {
      const formData = new FormData();
      
      // Add source image file
      if (selectedFace.id === 'uploaded') {
        formData.append('source', selectedFace.file);
      } else {
        // Fetch the image file from the public directory
        const sourceResponse = await fetch(selectedFace.imagePath);
        const sourceBlob = await sourceResponse.blob();
        formData.append('source', sourceBlob, selectedFace.imagePath.split('/').pop());
      }

      // Add target video file
      const targetResponse = await fetch(selectedTemplate.videoPath);
      const targetBlob = await targetResponse.blob();
      formData.append('target', targetBlob, selectedTemplate.videoPath.split('/').pop());

      const response = await fetch("/api/facefusion", {
        method: "POST",
        body: formData, // Send as FormData instead of JSON
      });
      
      const data = await response.json();
      // Handle response...
    } catch (error) {
      console.error("Face fusion error:", error);
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Left side - Templates */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Templates</h2>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((template) => (
            <div 
              key={template.id}
              className={`cursor-pointer border-2 ${selectedTemplate?.id === template.id ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => handleTemplateClick(template)}
            >
              <Image
                src={template.thumbnail}
                alt={`Template ${template.id}`}
                width={116}
                height={176}
                className="w-full h-auto target-dimensions"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Middle - Preview */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center rounded-lg relative">
        {previewImage ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-70"
            >
              ×
            </button>
            <video
              src={previewImage}
              controls
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-100 rounded-lg shadow-sm">
            <p className="text-gray-700 mb-4">Step 1: Select a template to preview</p>
            <p className="text-gray-700">Step 2: Add a face from the right panel, then generate</p>
          </div>
        )}
      </div>

      {/* Right side - Face Selection */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg flex flex-col">
        {/* Face Swap Preview Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Face Swap Preview</h2>
          <div className="flex gap-4 justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
              {selectedTemplate && (
                <Image
                  src={selectedTemplate.thumbnail}
                  alt="Target"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
              {selectedFace && (
                <Image
                  src={selectedFace.imagePath}
                  alt="Source"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Source Images Section */}
        <div className="flex-grow">
          <h2 className="text-lg font-bold mb-4">Source Images</h2>
          <div className="grid grid-cols-3 gap-2">
            {/* Upload button */}
            <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <span className="text-2xl text-gray-400">+</span>
            </label>
            
            {/* Source images */}
            {[...FACES, ...(uploadedImage ? [uploadedImage] : [])].map((face) => (
              <div 
                key={face.id}
                className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 ${
                  selectedFace?.id === face.id ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => handleFaceClick(face)}
              >
                <Image
                  src={face.imagePath}
                  alt={`Face ${face.id}`}
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
          onClick={handleGenerateClick}
          disabled={!selectedTemplate || !selectedFace}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Generate
        </button>
      </div>
    </div>
  );
};

export default FaceSwapPage;
