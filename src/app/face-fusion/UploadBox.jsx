import { Plus } from 'lucide-react'
import Loading from '@/components/Loading'

export default function UploadBox({
  type,
  accept,
  onUpload,
  title,
  description,
  aspectRatio = 'aspect-[116/176]',
  loading = false,
}) {
  return (
    <div
      className={`cursor-pointer border-2 relative bg-[#2b2c32] rounded-[12px] ${aspectRatio} flex flex-col items-center justify-center hover:bg-[#3a3d44] transition-colors`}
    >
      <label
        htmlFor={`upload-${type}`}
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
      >
        <input
          id={`upload-${type}`}
          type="file"
          className="hidden"
          accept={accept}
          onChange={onUpload}
          aria-label={`Upload ${title}`}
          disabled={loading}
        />
        {loading ? (
          <div className="w-8 h-8 flex items-center justify-center mb-2">
            <Loading />
          </div>
        ) : (
          <Plus className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
        )}
        <div className="text-center">
          <span className="text-sm text-gray-400 block">{loading ? 'Uploading...' : title}</span>
          <span className="text-xs text-gray-500 block mt-1">{description}</span>
        </div>
      </label>
    </div>
  )
}
