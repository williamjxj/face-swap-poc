import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

const FFMPEG_PATH = 'ffmpeg' // Assuming ffmpeg is in PATH, otherwise use absolute path
const DEFAULT_WATERMARK_TEXT = 'FACE SWAP POC'

/**
 * Add a text watermark to a video file
 *
 * @param {string} inputPath - Path to the input video file
 * @param {Object} options - Watermark options
 * @param {string} options.outputPath - Path to save the watermarked video (optional)
 * @param {string} options.text - Watermark text (defaults to app name)
 * @param {string} options.position - Watermark position (topleft, topright, bottomleft, bottomright, center)
 * @param {number} options.fontSize - Font size in pixels
 * @param {string} options.fontColor - Font color in hex format
 * @param {number} options.opacity - Opacity of watermark (0.0-1.0)
 * @returns {Promise<Object>} - Path to the watermarked video
 */
export async function addTextWatermark(
  inputPath,
  {
    outputPath = null,
    text = DEFAULT_WATERMARK_TEXT,
    position = 'bottomright',
    fontSize = 24,
    fontColor = 'white',
    opacity = 0.7,
  } = {}
) {
  try {
    // Generate output path if not provided
    if (!outputPath) {
      const inputDir = path.dirname(inputPath)
      const inputExt = path.extname(inputPath)
      const inputBasename = path.basename(inputPath, inputExt)
      outputPath = path.join(inputDir, `${inputBasename}_watermarked${inputExt}`)
    }

    // Create directories if they don't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Determine position coordinates based on the named position
    let positionCoordinates
    switch (position) {
      case 'topleft':
        positionCoordinates = '10:10'
        break
      case 'topright':
        positionCoordinates = 'w-tw-10:10'
        break
      case 'bottomleft':
        positionCoordinates = '10:h-th-10'
        break
      case 'center':
        positionCoordinates = '(w-tw)/2:(h-th)/2'
        break
      case 'bottomright':
      default:
        positionCoordinates = 'w-tw-10:h-th-10'
        break
    }

    // Build FFmpeg command for adding text watermark
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-vf',
      `drawtext=text='${text}':fontcolor=${fontColor}@${opacity}:fontsize=${fontSize}:x=${positionCoordinates.split(':')[0]}:y=${positionCoordinates.split(':')[1]}`,
      '-codec:a',
      'copy', // Copy audio stream without re-encoding
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
          reject(new Error(`FFmpeg watermark process exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', err => {
        reject(new Error(`Failed to start FFmpeg watermark process: ${err.message}`))
      })
    })

    return result
  } catch (error) {
    console.error('Video watermarking error:', error)
    throw error
  }
}

/**
 * Add an image watermark to a video file
 *
 * @param {string} inputPath - Path to the input video file
 * @param {string} watermarkImagePath - Path to the watermark image
 * @param {Object} options - Watermark options
 * @param {string} options.outputPath - Path to save the watermarked video (optional)
 * @param {string} options.position - Watermark position (topleft, topright, bottomleft, bottomright, center)
 * @param {number} options.scale - Scale factor for the watermark (default: 0.2 = 20% of video width)
 * @param {number} options.opacity - Opacity of watermark (0.0-1.0)
 * @returns {Promise<Object>} - Path to the watermarked video
 */
export async function addImageWatermark(
  inputPath,
  watermarkImagePath,
  { outputPath = null, position = 'bottomright', scale = 0.2, opacity = 0.7 } = {}
) {
  try {
    // Verify watermark image exists
    try {
      await fs.access(watermarkImagePath)
    } catch (err) {
      throw new Error(`Watermark image not found at ${watermarkImagePath}`)
    }

    // Generate output path if not provided
    if (!outputPath) {
      const inputDir = path.dirname(inputPath)
      const inputExt = path.extname(inputPath)
      const inputBasename = path.basename(inputPath, inputExt)
      outputPath = path.join(inputDir, `${inputBasename}_watermarked${inputExt}`)
    }

    // Create directories if they don't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Determine position coordinates based on the named position
    let positionCoordinates
    switch (position) {
      case 'topleft':
        positionCoordinates = '10:10'
        break
      case 'topright':
        positionCoordinates = 'main_w-overlay_w-10:10'
        break
      case 'bottomleft':
        positionCoordinates = '10:main_h-overlay_h-10'
        break
      case 'center':
        positionCoordinates = '(main_w-overlay_w)/2:(main_h-overlay_h)/2'
        break
      case 'bottomright':
      default:
        positionCoordinates = 'main_w-overlay_w-10:main_h-overlay_h-10'
        break
    }

    // Build FFmpeg command for adding image watermark with overlay
    const ffmpegArgs = [
      '-i',
      inputPath,
      '-i',
      watermarkImagePath,
      '-filter_complex',
      `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[overlay];[0:v][overlay]overlay=${positionCoordinates}:format=auto,format=yuv420p`,
      '-codec:a',
      'copy', // Copy audio stream without re-encoding
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
          reject(new Error(`FFmpeg image watermark process exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', err => {
        reject(new Error(`Failed to start FFmpeg image watermark process: ${err.message}`))
      })
    })

    return result
  } catch (error) {
    console.error('Video image watermarking error:', error)
    throw error
  }
}
