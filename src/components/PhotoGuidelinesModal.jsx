"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function PhotoGuidelinesModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-medium">How to Create High-Quality Photos</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Correct example 1"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Correct example 2"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Correct example 3"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Correct example 4"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
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
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Incorrect example 1"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Incorrect example 2"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Incorrect example 3"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Incorrect example 4"
                  width={200}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
            onClick={onClose}
          >
            OK, I understand!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
