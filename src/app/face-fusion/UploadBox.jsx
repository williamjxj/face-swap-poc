import { Plus } from "lucide-react"

export default function UploadBox({ 
  type, 
  accept, 
  onUpload, 
  title, 
  description,
  aspectRatio = "aspect-[116/176]"
}) {
  return (
    <div 
      className={`cursor-pointer border-2 relative bg-[#2b2c32] rounded-[12px] ${aspectRatio} flex flex-col items-center justify-center hover:bg-[#3a3d44] transition-colors`}
    >
      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={onUpload}
        />
        <Plus className="w-8 h-8 text-gray-400 mb-2" />
        <div className="text-center">
          <span className="text-sm text-gray-400 block">{title}</span>
          <span className="text-xs text-gray-500 block mt-1">{description}</span>
        </div>
      </label>
    </div>
  )
} 