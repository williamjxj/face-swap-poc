// deepseek
import { useState } from "react";
import { FiUpload } from "react-icons/fi";

export default function ImageUploader1() {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <input type="file" className="hidden" id="upload" accept="image/*" />
        <label htmlFor="upload" className="cursor-pointer text-blue-600">
          Click to Upload
        </label>
        <span className="mt-2 text-sm text-gray-500">Supports PNG, JPG</span>
      </div>
    );
  }

export default function ImageUploader({ onUpload }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="upload" />
      <label htmlFor="upload" className="cursor-pointer flex flex-col items-center gap-4">
        <FiUpload className="w-12 h-12 text-blue-500" />
        <span className="text-gray-600">拖放文件或点击上传</span>
        {preview && (
          <img src={preview} alt="Preview" className="mt-4 max-h-64 rounded-lg object-contain" />
        )}
      </label>
    </div>
  );
}