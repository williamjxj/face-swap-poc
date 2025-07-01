import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations, fallback to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  console.warn('Supabase environment variables not found. Some features may not work properly.')
}

export { supabase }

// Bucket mapping for different file types
export const STORAGE_BUCKETS = {
  GENERATED_OUTPUTS: 'generated-outputs',
  TEMPLATE_VIDEOS: 'template-videos',
  TEMPLATE_THUMBNAILS: 'template-thumbnails',
  FACE_SOURCES: 'face-sources',
  GUIDELINE_IMAGES: 'guideline-images',
  ASSETS: 'assets',
}

/**
 * Get the full public URL for a file in Supabase Storage
 * @param {string} filePath - The file path in the bucket (e.g., "generated-outputs/video.mp4")
 * @returns {string} Full public URL
 */
export function getStorageUrl(filePath) {
  if (!filePath) return null

  // If it's already a full URL, return as-is
  if (filePath.startsWith('http')) {
    return filePath
  }

  // Extract bucket and path
  const [bucket, ...pathParts] = filePath.split('/')
  const path = pathParts.join('/')

  if (!bucket || !path) {
    console.warn('Invalid file path format:', filePath)
    return null
  }

  // Fallback to direct URL construction if Supabase client is not available
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.warn('Supabase client not available, using fallback URL construction:', error.message)

    // Fallback: construct URL manually using known Supabase URL format
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yunxidsqumhfushjcgyg.supabase.co'
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  }
}

/**
 * Get a signed URL for private files (if needed)
 * @param {string} filePath - The file path in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  if (!filePath || !supabase) return null

  const [bucket, ...pathParts] = filePath.split('/')
  const path = pathParts.join('/')

  if (!bucket || !path) {
    console.warn('Invalid file path format:', filePath)
    return null
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }

  return data.signedUrl
}

/**
 * Upload a file to Supabase Storage
 * @param {File|Buffer} file - The file to upload
 * @param {string} filePath - The destination path (e.g., "generated-outputs/video.mp4")
 * @param {Object} options - Upload options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function uploadFile(file, filePath, options = {}) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
    }

    const [bucket, ...pathParts] = filePath.split('/')
    const path = pathParts.join('/')

    if (!bucket || !path) {
      return { success: false, error: 'Invalid file path format' }
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: options.overwrite || false,
      ...options,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The file path to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(filePath) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
    }

    const [bucket, ...pathParts] = filePath.split('/')
    const path = pathParts.join('/')

    if (!bucket || !path) {
      return { success: false, error: 'Invalid file path format' }
    }

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
