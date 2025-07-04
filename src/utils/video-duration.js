/**
 * Utility functions for calculating video duration
 */

/**
 * Calculate video duration from a video file buffer or URL
 * This is a client-side function that works in the browser
 */
export const getVideoDurationFromFile = file => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate video duration from a video URL
 * This is a client-side function that works in the browser
 */
export const getVideoDurationFromUrl = url => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    video.onloadedmetadata = () => {
      resolve(video.duration)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }

    video.src = url
  })
}

/**
 * Estimate video duration based on file size (fallback method)
 * This is a rough estimation and should only be used when actual duration cannot be calculated
 */
export const estimateVideoDurationFromFileSize = fileSizeBytes => {
  // Rough estimation based on typical video bitrates
  // Assuming average bitrate of 1-2 Mbps for face swap videos
  const averageBitrate = (1.5 * 1024 * 1024) / 8 // 1.5 Mbps in bytes per second
  const estimatedDuration = fileSizeBytes / averageBitrate

  // Clamp to reasonable bounds (2-60 seconds for face swap videos)
  return Math.max(2, Math.min(60, estimatedDuration))
}

/**
 * Format duration in seconds to MM:SS format
 */
export const formatDuration = seconds => {
  if (!seconds || seconds === 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Update video duration in the database
 */
export const updateVideoDurationInDB = async (videoId, duration) => {
  try {
    const response = await fetch(`/api/generated-media/${videoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration }),
    })

    if (!response.ok) {
      throw new Error('Failed to update video duration')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating video duration:', error)
    throw error
  }
}
