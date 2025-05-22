import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const FFMPEG_PATH = 'ffmpeg' // Assuming ffmpeg is in PATH, otherwise use absolute path

/**
 * Optimizes a video for faster loading and streaming playback.
 *
 * @param {string} inputPath - Path to the input video file
 * @param {Object} options - Optimization options
 * @param {string} options.outputPath - Path to save the optimized video (optional)
 * @param {number} options.width - Target width (optional, maintains aspect ratio)
 * @param {string} options.preset - FFmpeg preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
 * @param {number} options.crf - Constant Rate Factor (0-51, lower is better quality, 18-28 is reasonable)
 * @param {number} options.keyframeInterval - Keyframe interval in seconds
 * @param {boolean} options.generateThumbnail - Whether to generate a thumbnail
 * @returns {Promise<Object>} - Paths to optimized video and optional thumbnail
 */
export async function optimizeVideo(
  inputPath,
  {
    outputPath = null,
    width = 720,
    preset = 'veryfast',
    crf = 23,
    keyframeInterval = 2,
    generateThumbnail = true,
  } = {}
) {
  try {
    // Generate output path if not provided
    if (!outputPath) {
      const inputDir = path.dirname(inputPath)
      const inputExt = path.extname(inputPath)
      const inputBasename = path.basename(inputPath, inputExt)
      outputPath = path.join(inputDir, `${inputBasename}_optimized${inputExt}`)
    }

    // Create directories if they don't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Build FFmpeg command for video optimization
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-c:v',
      'libx264', // Video codec
      '-preset',
      preset,
      '-crf',
      crf.toString(),
      '-c:a',
      'aac', // Audio codec
      '-b:a',
      '128k', // Audio bitrate
      '-vf',
      `scale='min(${width},iw)':-2`, // Scale to given width but maintain aspect ratio
      '-g',
      (keyframeInterval * 30).toString(), // Keyframe interval
      '-movflags',
      '+faststart', // Optimize for web streaming
      '-y', // Overwrite output file if exists
      outputPath,
    ]

    // Execute FFmpeg command
    const result = await new Promise((resolve, reject) => {
      const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs)
      let stderr = ''

      ffmpeg.stderr.on('data', data => {
        stderr += data.toString()
      })

      ffmpeg.on('close', code => {
        if (code === 0) {
          resolve({ outputPath })
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', err => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`))
      })
    })

    // Generate thumbnail if requested
    if (generateThumbnail) {
      const thumbnailPath = await generateVideoThumbnail(outputPath)
      result.thumbnailPath = thumbnailPath
    }

    return result
  } catch (error) {
    console.error('Video optimization error:', error)
    throw error
  }
}

/**
 * Generates a thumbnail for a video at the specified second
 *
 * @param {string} videoPath - Path to the video file
 * @param {number} atSecond - Which second of the video to use for the thumbnail
 * @returns {Promise<string>} - Path to the generated thumbnail
 */
export async function generateVideoThumbnail(videoPath, atSecond = 1) {
  try {
    const videoDir = path.dirname(videoPath)
    const videoBasename = path.basename(videoPath, path.extname(videoPath))

    // Create thumbnails directory within public/outputs if needed
    const thumbnailDir = path.join(path.dirname(videoDir), 'thumbnails')
    await fs.mkdir(thumbnailDir, { recursive: true })

    const thumbnailPath = path.join(thumbnailDir, `${videoBasename}_thumb.jpg`)

    const ffmpegArgs = [
      '-i',
      videoPath,
      '-ss',
      atSecond.toString(),
      '-vframes',
      '1',
      '-vf',
      'scale=300:-2',
      '-q:v',
      '2', // High quality
      '-y', // Overwrite
      thumbnailPath,
    ]

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs)
      let stderr = ''

      ffmpeg.stderr.on('data', data => {
        stderr += data.toString()
      })

      ffmpeg.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', err => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`))
      })
    })

    return thumbnailPath
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    throw error
  }
}

/**
 * Analyzes a video to get information about it including duration, bitrate, codecs, etc.
 *
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<Object>} - Video information
 */
export async function analyzeVideo(videoPath) {
  try {
    const tempJsonPath = path.join('/tmp', `${uuidv4()}.json`)

    const ffprobeArgs = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ]

    await new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', ffprobeArgs, {
        stdio: ['ignore', fs.openSync(tempJsonPath, 'w'), 'pipe'],
      })
      let stderr = ''

      ffprobe.stderr.on('data', data => {
        stderr += data.toString()
      })

      ffprobe.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFprobe process exited with code ${code}: ${stderr}`))
        }
      })

      ffprobe.on('error', err => {
        reject(new Error(`Failed to start FFprobe process: ${err.message}`))
      })
    })

    // Read and parse the JSON file
    const jsonData = await fs.readFile(tempJsonPath, 'utf8')
    await fs.unlink(tempJsonPath) // Clean up

    const videoInfo = JSON.parse(jsonData)

    // Extract basic information
    const format = videoInfo.format || {}
    const videoStream = videoInfo.streams?.find(stream => stream.codec_type === 'video') || {}

    return {
      duration: parseFloat(format.duration || '0'),
      size: parseInt(format.size || '0'),
      bitrate: parseInt(format.bit_rate || '0'),
      format: format.format_name,
      width: videoStream.width,
      height: videoStream.height,
      codec: videoStream.codec_name,
      framerate: eval(videoStream.avg_frame_rate || '0'), // eval converts "24/1" to 24
    }
  } catch (error) {
    console.error('Video analysis error:', error)
    throw error
  }
}
