import Image from "next/image"
import UploadBox from "./UploadBox"
import { formatDuration } from '../../utils/formatUtils'


export default function TabContent({ 
  selectedTab, 
  templates, 
  selectedTemplate, 
  onSelectTemplate,
  onTargetUpload,
  onImageUpload,
  onGifUpload,
  onMultiFaceUpload,
  onDeleteTemplate
}) {
  const renderVideoTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="video"
            accept="video/mp4,video/wav"
            onUpload={onTargetUpload}
            title="Custom Video"
            description="视频：最大500MB/10分钟"
            className="w-full h-full"
          />
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 scale-[1.02]' 
                : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="relative group">
              <img
                src={template.thumbnailPath}
                alt={template.name}
                className="w-[116px] h-[176px] object-cover rounded-lg target-dimensions"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id, e);
                }}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-white text-xs font-medium">
                  {formatDuration(template.duration)}
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderImageTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="image"
            accept="image/png,image/jpeg,image/jpg"
            onUpload={onImageUpload}
            title="Upload Image"
            description="PNG, JPEG up to 10MB"
            className="w-full h-full"
          />
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 scale-[1.02]' 
                : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="relative group">
              <img
                src={template.thumbnailPath}
                alt={template.name}
                className="w-[116px] h-[176px] object-cover rounded-lg target-dimensions"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id, e);
                }}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-white text-xs font-medium">
                  {formatDuration(template.duration)}
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderGifTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="gif"
            accept="image/gif"
            onUpload={onGifUpload}
            title="Upload GIF"
            description="GIF up to 50MB"
            className="w-full h-full"
          />
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 scale-[1.02]' 
                : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="relative group">
              <img
                src={template.thumbnailPath}
                alt={template.name}
                className="w-[116px] h-[176px] object-cover rounded-lg target-dimensions"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id, e);
                }}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-white text-xs font-medium">
                  {formatDuration(template.duration)}
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderMultiFaceTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="w-[116px] h-[176px]">
          <UploadBox
            type="multi-face"
            accept="image/png,image/jpeg,image/jpg"
            onUpload={onMultiFaceUpload}
            title="Multi-face Upload"
            description="Upload multiple faces (PNG, JPEG)"
            className="w-full h-full"
          />
        </div>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 scale-[1.02]' 
                : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="relative group">
              <img
                src={template.thumbnailPath}
                alt={template.name}
                className="w-[116px] h-[176px] object-cover rounded-lg target-dimensions"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id, e);
                }}
                className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700/80"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-white text-xs font-medium">
                  {formatDuration(template.duration)}
                </div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  switch (selectedTab) {
    case 'video':
      return renderVideoTab()
    case 'image':
      return renderImageTab()
    case 'gif':
      return renderGifTab()
    case 'multi-face':
      return renderMultiFaceTab()
    default:
      return null
  }
} 