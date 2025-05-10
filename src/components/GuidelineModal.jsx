"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"

export default function FaceFusionGuidelinesModal({ isOpen, onClose }) {
  const [guidelines, setGuidelines] = useState({ allowed: [], notAllowed: [] });

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const response = await fetch('/api/guidelines');
        const data = await response.json();
        
        // Split guidelines into allowed and not allowed
        const allowed = data.filter(g => g.isAllowed);
        const notAllowed = data.filter(g => !g.isAllowed);
        
        setGuidelines({ allowed, notAllowed });
      } catch (error) {
        console.error('Error fetching guidelines:', error);
      }
    };

    if (isOpen) {
      fetchGuidelines();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-2 rounded-lg sm:max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto relative">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-center text-xl font-medium w-full">How to Create High-Quality Photos</h2>
            <button 
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <p className="text-base">1. Close-up, head and shoulders shot</p>
              <p className="text-base">2. Appropriate head movement range</p>
              <p className="text-base">
                3. Face without occlusion or minimal occlusion, no closed eyes/drowsy expressions
              </p>
            </div>

            <div className="mt-6">
              <div className="relative flex items-center justify-center py-2 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex items-center bg-green-100 px-6 py-2 rounded-full">
                  <svg className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Correct Examples</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {guidelines.allowed.map((guideline, i) => (
                  <div key={guideline.id} className="overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={guideline.filePath}
                      alt={guideline.filename}
                      width={200}
                      height={200}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="relative flex items-center justify-center py-2 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex items-center bg-red-100 px-6 py-2 rounded-full">
                  <svg className="h-5 w-5 text-red-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-red-800">Incorrect Examples</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {guidelines.notAllowed.map((guideline, i) => (
                  <div key={guideline.id} className="overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={guideline.filePath}
                      alt={guideline.filename}
                      width={200}
                      height={200}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white py-2 px-4 rounded-lg"
              onClick={onClose}
            >
              OK, I understand!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
