import { uploadFile, getPublicUrl, deleteFile } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// Storage bucket names
export const BUCKETS = {
  FACE_SOURCES: 'face-sources',
  TARGET_TEMPLATES: 'target-templates',
  GENERATED_MEDIA: 'generated-media',
  THUMBNAILS: 'thumbnails',
  GUIDELINES: 'guidelines',
}

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const validateFile = (
  file,
  allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
) => {
  if (!file) {
    throw new Error('No file provided')
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
  }

  return true
}

// Generate unique file path
export const generateFilePath = (originalName, userId, prefix = '') => {
  const timestamp = Date.now()
  const uuid = uuidv4().split('-')[0] // Short UUID
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')

  return `${userId}/${prefix}${timestamp}_${uuid}_${sanitizedName}`
}

// Upload face source image
export const uploadFaceSource = async (file, userId) => {
  try {
    validateFile(file, ALLOWED_IMAGE_TYPES)

    const filePath = generateFilePath(file.name, userId, 'face_')
    const uploadResult = await uploadFile(BUCKETS.FACE_SOURCES, filePath, file)

    return {
      path: filePath,
      url: getPublicUrl(BUCKETS.FACE_SOURCES, filePath),
      size: file.size,
      type: file.type,
      ...uploadResult,
    }
  } catch (error) {
    console.error('Face source upload error:', error)
    throw error
  }
}

// Upload target template (video/image)
export const uploadTargetTemplate = async (file, userId) => {
  try {
    validateFile(file)

    const filePath = generateFilePath(file.name, userId, 'template_')
    const uploadResult = await uploadFile(BUCKETS.TARGET_TEMPLATES, filePath, file)

    return {
      path: filePath,
      url: getPublicUrl(BUCKETS.TARGET_TEMPLATES, filePath),
      size: file.size,
      type: file.type,
      ...uploadResult,
    }
  } catch (error) {
    console.error('Target template upload error:', error)
    throw error
  }
}

// Upload generated media
export const uploadGeneratedMedia = async (file, userId) => {
  try {
    const filePath = generateFilePath(file.name, userId, 'generated_')
    const uploadResult = await uploadFile(BUCKETS.GENERATED_MEDIA, filePath, file)

    return {
      path: filePath,
      url: getPublicUrl(BUCKETS.GENERATED_MEDIA, filePath),
      size: file.size,
      type: file.type,
      ...uploadResult,
    }
  } catch (error) {
    console.error('Generated media upload error:', error)
    throw error
  }
}

// Upload thumbnail
export const uploadThumbnail = async (file, userId) => {
  try {
    validateFile(file, ALLOWED_IMAGE_TYPES)

    const filePath = generateFilePath(file.name, userId, 'thumb_')
    const uploadResult = await uploadFile(BUCKETS.THUMBNAILS, filePath, file)

    return {
      path: filePath,
      url: getPublicUrl(BUCKETS.THUMBNAILS, filePath),
      size: file.size,
      type: file.type,
      ...uploadResult,
    }
  } catch (error) {
    console.error('Thumbnail upload error:', error)
    throw error
  }
}

// Delete file from storage
export const deleteStorageFile = async (bucket, path) => {
  try {
    return await deleteFile(bucket, path)
  } catch (error) {
    console.error('File deletion error:', error)
    throw error
  }
}

// Get file URL
export const getFileUrl = (bucket, path) => {
  return getPublicUrl(bucket, path)
}

// Create thumbnail from video (client-side)
export const createVideoThumbnail = videoFile => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      video.currentTime = 1 // Capture frame at 1 second
    }

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create thumbnail'))
            }
          },
          'image/jpeg',
          0.8
        )
      } catch (canvasError) {
        console.warn('Canvas tainted in createVideoThumbnail:', canvasError.message)
        reject(new Error('Canvas tainted - cannot create thumbnail'))
      }
    }

    video.onerror = () => reject(new Error('Failed to load video'))
    video.crossOrigin = 'anonymous'
    video.src = URL.createObjectURL(videoFile)
  })
}

// Utility to convert file to base64 (for API calls)
export const fileToBase64 = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}
