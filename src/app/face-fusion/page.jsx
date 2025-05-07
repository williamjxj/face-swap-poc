'use client';

import Image from "next/image";
import { useState } from "react";

// Sample template and face images from public directory
const TEMPLATES = [
  { id: 1, src: '/videos/1.mp4', thumbnail: '/thumbnails/1_thumbnail.webp' },
  { id: 2, src: '/videos/2.mp4', thumbnail: '/thumbnails/2_thumbnail.webp' },
  { id: 3, src: '/videos/3.mp4', thumbnail: '/thumbnails/3_thumbnail.webp' },
  { id: 4, src: '/videos/4.mp4', thumbnail: '/thumbnails/4_thumbnail.webp' },
  { id: 5, src: '/videos/5.mp4', thumbnail: '/thumbnails/5_thumbnail.webp' }
];

const FACES = [
  { id: 1, src: '/videos/1.mp4', thumbnail: '/thumbnails/1_thumbnail.webp' },
  { id: 2, src: '/videos/2.mp4', thumbnail: '/thumbnails/2_thumbnail.webp' },
  { id: 3, src: '/videos/3.mp4', thumbnail: '/thumbnails/3_thumbnail.webp' }
];

const FaceSwapPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFace, setSelectedFace] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setPreviewImage(template.src);
  };

  const handleFaceClick = (face) => {
    setSelectedFace(face);
  };

  const handleCreateClick = async () => {
    if (!selectedTemplate || !selectedFace) return;

    try {
      const response = await fetch("/api/face-swap", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          faceId: selectedFace.id
        }),
      });
      const data = await response.json();
      // Handle response...
    } catch (error) {
      console.error("Face swap error:", error);
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
                className="w-full h-auto source-dimensions"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Middle - Preview */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center rounded-lg">
        {previewImage ? (
          <video
            src={previewImage}
            controls
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: "70vh" }}
          />
        ) : (
          <div className="text-gray-400">Select a template to preview</div>
        )}
      </div>

      {/* Right side - Faces */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg flex flex-col">
        <h2 className="text-lg font-bold mb-4">Faces</h2>
        <div className="grid grid-cols-2 gap-4 flex-grow">
          {FACES.map((face) => (
            <div 
              key={face.id}
              className={`cursor-pointer rounded-full overflow-hidden border-2 ${selectedFace?.id === face.id ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => handleFaceClick(face)}
            >
              <Image
                src={face.thumbnail}
                alt={`Face ${face.id}`}
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleCreateClick}
          disabled={!selectedTemplate || !selectedFace}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default FaceSwapPage;
