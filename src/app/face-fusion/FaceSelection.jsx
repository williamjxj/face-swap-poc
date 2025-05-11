import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import styles from './page.module.css';

export default function FaceSelection({
  selectedTemplate,
  selectedFace, 
  onFaceSelect, 
  imageSources, 
  selectedSource,
  onSourceSelect,
  onSourceUpload,
  onSourceDelete 
}) {
  return (
    <div className="p-4">
      {/* Face Selection Preview */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4 text-white">Face Selection</h2>
        <div className="flex gap-4 justify-center relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
            {selectedTemplate ? (
              <Image
                src={selectedTemplate.thumbnailPath}
                alt="Template thumbnail"
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
          <div className={styles.connecting_line}></div>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
            {selectedSource ? (
              <Image
                src={selectedSource.preview}
                alt="Selected face"
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

      {/* Source Images Grid */}
      <div className="flex-grow">
        <h2 className="text-lg font-bold mb-4 text-white">Source Images</h2>
        <div className="grid grid-cols-3 gap-2">
          {/* Upload button */}
          <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#2a2d34] transition-colors">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onSourceUpload}
            />
            <Plus className="w-6 h-6 text-gray-400" />
          </label>
          
          {/* Source images */}
          {imageSources.map((image) => (
            <div 
              key={image.id}
              className="relative"
            >
              <div
                className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  selectedSource?.name === image.name 
                    ? 'ring-2 ring-blue-500 scale-[1.02]' 
                    : 'hover:scale-[1.02] hover:ring-1 hover:ring-gray-400'
                }`}
                onClick={() => onSourceSelect(image)}
              >
                <Image 
                  src={image.imagePath}
                  alt={`Source ${image.id}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={(e) => onSourceDelete(image, e)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
