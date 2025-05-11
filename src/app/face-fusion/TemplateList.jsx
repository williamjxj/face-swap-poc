import { useState } from 'react';
import { formatDuration } from '../../utils/formatUtils';

export default function TemplateList({ templates, onSelectTemplate, selectedTemplate }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-white">Templates</h2>
      <div className="grid grid-cols-3 gap-3">
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
  );
} 