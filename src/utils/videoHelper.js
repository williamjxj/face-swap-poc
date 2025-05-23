import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function getVideoDuration(videoPath) {
  try {
    // Check if file exists first
    if (!fs.existsSync(videoPath)) {
      console.warn(`Video file not found at path: ${videoPath}`)
      return 0
    }

    // Use ffprobe to get video duration
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const { stdout } = await execAsync(command)

    // Handle empty output
    if (!stdout.trim()) {
      console.warn('Empty duration output from ffprobe, returning default 0')
      return 0
    }

    const duration = parseFloat(stdout)
    return isNaN(duration) ? 0 : Math.round(duration)
  } catch (error) {
    console.error('Error getting video duration:', error)
    // Return a safe default value instead of throwing
    return 0
  }
}

export async function video2thumbnail(videoPath, outputDir, thumbnailFilename) {
  try {
    // Check if file exists first
    if (!fs.existsSync(videoPath)) {
      console.warn(`Video file not found at path: ${videoPath}`)
      return null
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const thumbnailPath = path.join(outputDir, thumbnailFilename)

    // Use a more robust ffmpeg command with error handling
    // Add timeout to prevent hanging
    const command = `ffmpeg -y -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=116:176:force_original_aspect_ratio=decrease,pad=116:176:(ow-iw)/2:(oh-ih)/2" -quality 90 -compression_level 4 "${thumbnailPath}"`

    await execAsync(command, { timeout: 30000 }) // 30 second timeout

    // Verify the thumbnail was created
    if (!fs.existsSync(thumbnailPath)) {
      console.warn('Thumbnail file was not created')
      return null
    }

    return thumbnailPath
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return null // Return null instead of throwing
  }
}
