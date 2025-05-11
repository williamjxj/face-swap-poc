import Image from "next/image"
import UploadBox from "./UploadBox"

export default function TabContent({ 
  selectedTab, 
  videoTargets, 
  selectedTarget, 
  onTargetSelect,
  onTargetUpload,
  onImageUpload,
  onGifUpload,
  onMultiFaceUpload
}) {
  const renderVideoTab = () => (
    <div className="w-full bg-[#1a1d24] p-2 rounded-lg">
      <div className="grid grid-cols-2 gap-2">
        <UploadBox
          type="video"
          accept="video/mp4,video/wav"
          onUpload={onTargetUpload}
          title="Custom Video"
          description="视频：最大500MB/10分钟"
        />
        {videoTargets.map((video) => (
          <div 
            key={video.id}
            className={`cursor-pointer border-2 relative ${selectedTarget?.id === video.id ? 'border-blue-500' : 'border-transparent'}`}
            style={{
              background: '#2b2c32',
              "borderRadius": '12px',
              cursor: 'pointer',
            }}
            onClick={() => onTargetSelect(video)}
          >
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full text-xs text-white z-10">
              {video.duration}
            </div>
            <Image
              src={video.thumbnailPath}
              alt={`Video ${video.id}`}
              width={116}
              height={176}
              className="w-full h-[176px] object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderImageTab = () => (
    <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
      <UploadBox
        type="image"
        accept="image/png,image/jpeg,image/jpg"
        onUpload={onImageUpload}
        title="Upload Image"
        description="PNG, JPEG up to 10MB"
        aspectRatio="aspect-square"
      />
    </div>
  )

  const renderGifTab = () => (
    <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
      <UploadBox
        type="gif"
        accept="image/gif"
        onUpload={onGifUpload}
        title="Upload GIF"
        description="GIF up to 50MB"
        aspectRatio="aspect-square"
      />
    </div>
  )

  const renderMultiFaceTab = () => (
    <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
      <UploadBox
        type="multi-face"
        accept="image/png,image/jpeg,image/jpg"
        onUpload={onMultiFaceUpload}
        title="Multi-face Upload"
        description="Upload multiple faces (PNG, JPEG)"
        aspectRatio="aspect-square"
      />
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