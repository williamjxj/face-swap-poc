// Consolidated video utilities
import { spawn, exec } from 'child_process'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)
const FFMPEG_PATH = 'ffmpeg' // Assuming ffmpeg is in PATH, otherwise use absolute path
const DEFAULT_WATERMARK_TEXT = 'FACE SWAP POC'

async function runFfmpeg(args, options = {}) {
  return new Promise((resolve, reject) => {
    const { onProgress, timeout = 300000 } = options

    const ffmpeg = spawn(FFMPEG_PATH, args)
    let stdout = ''
    let stderr = ''

    // Set timeout
    const timeoutId = setTimeout(() => {
      ffmpeg.kill('SIGTERM')
      reject(new Error(`FFMPEG process timed out after ${timeout}ms`))
    }, timeout)

    // Collect output
    ffmpeg.stdout.on('data', data => {
      stdout += data.toString()
    })

    ffmpeg.stderr.on('data', data => {
      const output = data.toString()
      stderr += output

      // If progress callback is provided, parse and call it
      if (onProgress && output.includes('time=')) {
        try {
          const timeMatch = output.match(/time=(\d+:\d+:\d+.\d+)/)
          if (timeMatch && timeMatch[1]) {
            const time = timeMatch[1]
            const [hours, minutes, seconds] = time.split(':').map(parseFloat)
            const currentTime = hours * 3600 + minutes * 60 + seconds
            onProgress(currentTime)
          }
        } catch (err) {
          // Ignore progress parsing errors
        }
      }
    })

    ffmpeg.on('close', code => {
      clearTimeout(timeoutId)
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`FFMPEG process exited with code ${code}: ${stderr}`))
      }
    })

    ffmpeg.on('error', err => {
      clearTimeout(timeoutId)
      reject(err)
    })
  })
}

export async function addTextWatermark(
  inputPath,
  {
    outputPath,
    text = DEFAULT_WATERMARK_TEXT,
    position = 'bottomright',
    fontSize = 24,
    fontColor = 'white',
    opacity = 0.8,
  } = {}
) {
  if (!inputPath || !(await fileExists(inputPath))) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  // Generate output path if not provided
  if (!outputPath) {
    const dir = path.dirname(inputPath)
    const ext = path.extname(inputPath)
    const name = path.basename(inputPath, ext)
    outputPath = path.join(dir, `${name}_watermarked${ext}`)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true }).catch(() => {})

  // Position mapping
  const positionMapping = {
    topleft: 'x=10:y=10',
    topright: 'x=w-tw-10:y=10',
    bottomleft: 'x=10:y=h-th-10',
    bottomright: 'x=w-tw-10:y=h-th-10',
    center: 'x=(w-tw)/2:y=(h-th)/2',
  }

  const positionArg = positionMapping[position] || positionMapping.bottomright

  // Build FFMPEG command
  const args = [
    '-i',
    inputPath,
    '-vf',
    `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}:${positionArg}`,
    '-codec:a',
    'copy',
    '-y',
    outputPath,
  ]

  try {
    await runFfmpeg(args)
    return { outputPath }
  } catch (error) {
    console.error('Error applying watermark:', error)
    throw new Error(`Failed to apply watermark: ${error.message}`)
  }
}

export async function optimizeVideo(
  inputPath,
  {
    outputPath,
    width,
    preset = 'medium',
    crf = 23,
    keyframeInterval = 2,
    generateThumbnail = false,
  } = {}
) {
  if (!inputPath || !(await fileExists(inputPath))) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  // Generate output path if not provided
  if (!outputPath) {
    const dir = path.dirname(inputPath)
    const ext = path.extname(inputPath)
    const name = path.basename(inputPath, ext)
    outputPath = path.join(dir, `${name}_optimized${ext}`)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true }).catch(() => {})

  // Build FFMPEG command
  const args = ['-i', inputPath]

  // Add scaling if width is specified
  if (width) {
    args.push('-vf', `scale=${width}:-2`)
  }

  // Try different video encoders in order of preference
  const videoEncoders = ['libx264', 'h264_vaapi', 'h264', 'libx265', 'copy']
  let selectedEncoder = 'copy' // fallback to copy without re-encoding
  
  // Test each encoder to find one that works
  for (const encoder of videoEncoders) {
    try {
      // Test if encoder is available
      await runFfmpeg(['-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1', '-c:v', encoder, '-t', '1', '-f', 'null', '-'], { timeout: 5000 })
      selectedEncoder = encoder
      console.log(`[OPTIMIZATION] Using video encoder: ${selectedEncoder}`)
      break
    } catch (err) {
      // Continue to next encoder
      continue
    }
  }

  // Add optimization parameters based on selected encoder
  if (selectedEncoder === 'copy') {
    // Just copy without re-encoding
    args.push('-c', 'copy', '-movflags', '+faststart', '-y', outputPath)
    console.log('[OPTIMIZATION] Using copy mode - no re-encoding')
  } else {
    // Use the selected encoder with optimization
    args.push(
      '-c:v',
      selectedEncoder,
      '-movflags',
      '+faststart'
    )
    
    // Add encoder-specific parameters
    if (selectedEncoder.includes('x264') || selectedEncoder.includes('h264')) {
      args.push('-preset', preset, '-crf', crf.toString())
      if (selectedEncoder === 'libx264') {
        args.push('-g', (keyframeInterval * 30).toString()) // keyframe interval for libx264
      }
    } else if (selectedEncoder.includes('x265')) {
      args.push('-preset', preset, '-crf', (crf + 5).toString()) // x265 needs higher CRF
    }
    
    // Add audio encoding if not copying
    args.push('-c:a', 'aac', '-b:a', '128k')
    
    args.push('-y', outputPath)
  }  try {
    console.log(`[OPTIMIZATION] Running FFmpeg with args: ${args.join(' ')}`)
    await runFfmpeg(args)

    // Verify output file was created
    if (!(await fileExists(outputPath))) {
      throw new Error('Output file was not created')
    }

    console.log(`[OPTIMIZATION] Video processing completed: ${outputPath}`)

    // Generate thumbnail if requested
    let thumbnailPath = null
    if (generateThumbnail) {
      try {
        thumbnailPath = path.join(
          path.dirname(outputPath),
          `${path.basename(outputPath, path.extname(outputPath))}_thumbnail.jpg`
        )
        await generateVideoThumbnail(outputPath, thumbnailPath)
        console.log(`[OPTIMIZATION] Thumbnail generated: ${thumbnailPath}`)
      } catch (thumbError) {
        console.warn(`[OPTIMIZATION] Failed to generate thumbnail: ${thumbError.message}`)
        // Continue without thumbnail
      }
    }

    return {
      outputPath,
      thumbnailPath,
    }
  } catch (error) {
    console.error('Error optimizing video:', error)
    
    // If optimization failed but input file exists, try copying it instead
    if (await fileExists(inputPath)) {
      console.log('[OPTIMIZATION] Attempting fallback copy operation...')
      try {
        await runFfmpeg(['-i', inputPath, '-c', 'copy', '-y', outputPath])
        console.log('[OPTIMIZATION] Fallback copy successful')
        return {
          outputPath,
          thumbnailPath: null,
        }
      } catch (copyError) {
        console.error('[OPTIMIZATION] Fallback copy also failed:', copyError)
      }
    }
    
    throw new Error(`Failed to optimize video: ${error.message}`)
  }
}

export async function generateVideoThumbnail(videoPath, outputPath, timeOffset = 1) {
  if (!videoPath || !(await fileExists(videoPath))) {
    throw new Error(`Video file not found: ${videoPath}`)
  }

  // Generate output path if not provided
  if (!outputPath) {
    const dir = path.dirname(videoPath)
    const name = path.basename(videoPath, path.extname(videoPath))
    outputPath = path.join(dir, `${name}_thumbnail.jpg`)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true }).catch(() => {})

  // Build FFMPEG command
  const args = [
    '-i',
    videoPath,
    '-ss',
    timeOffset.toString(),
    '-frames:v',
    '1',
    '-q:v',
    '2',
    '-y',
    outputPath,
  ]

  try {
    await runFfmpeg(args)
    return outputPath
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    throw new Error(`Failed to generate thumbnail: ${error.message}`)
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function getVideoInfo(videoPath) {
  if (!videoPath || !(await fileExists(videoPath))) {
    throw new Error(`Video file not found: ${videoPath}`)
  }

  try {
    const { stderr } = await runFfmpeg(['-i', videoPath])

    // Parse duration
    const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
    let duration = null
    if (durationMatch) {
      const hours = parseInt(durationMatch[1])
      const minutes = parseInt(durationMatch[2])
      const seconds = parseFloat(durationMatch[3])
      duration = hours * 3600 + minutes * 60 + seconds
    }

    // Parse dimensions
    const dimensionMatch = stderr.match(/(\d+)x(\d+)/)
    let width = null
    let height = null
    if (dimensionMatch) {
      width = parseInt(dimensionMatch[1])
      height = parseInt(dimensionMatch[2])
    }

    // Parse codec
    const videoCodecMatch = stderr.match(/Video: (\w+)/)
    const audioCodecMatch = stderr.match(/Audio: (\w+)/)

    return {
      duration,
      width,
      height,
      videoCodec: videoCodecMatch ? videoCodecMatch[1] : null,
      audioCodec: audioCodecMatch ? audioCodecMatch[1] : null,
      rawInfo: stderr,
    }
  } catch (error) {
    console.error('Error getting video info:', error)
    throw new Error(`Failed to get video info: ${error.message}`)
  }
}
