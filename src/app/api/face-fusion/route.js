import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { serializeBigInt } from '@/utils/helper'
import { optimizeVideo, generateVideoThumbnail } from '@/utils/videoUtils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

// Create a direct Prisma client instance just for this route
// This avoids triggering any middleware or global Prisma operations
const prisma = new PrismaClient({
  log: ['error'], // Minimize logging
})

// Environment variables for API endpoints (configure in .env.local)
const CREATE_API = process.env.MODAL_CREATE_API
const QUERY_API = process.env.MODAL_QUERY_API

// Maximum number of retry attempts for polling
const MAX_RETRIES = 60 // 5 minutes maximum (5 seconds × 60)
const POLLING_INTERVAL = 5000 // 5 seconds

// Configuration for video optimization
const VIDEO_OPTIMIZATION_ENABLED = true // Set to false to disable optimization
const VIDEO_OPTIMIZATION_CONFIG = {
  width: 720, // Target width
  preset: 'veryfast', // FFmpeg preset - faster for better UX
  crf: 23, // Quality (lower is better)
  keyframeInterval: 1, // More keyframes for better seeking
  generateThumbnail: true,
}

// Error types for better client-side handling
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  PROCESSING: 'PROCESSING_ERROR',
  API: 'API_ERROR',
  DOWNLOAD: 'DOWNLOAD_ERROR',
  OPTIMIZATION: 'OPTIMIZATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
}

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Verify the user exists in the database
    let validUserId = null
    if (userId) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        })
        if (userExists) {
          validUserId = userId
          console.log('[AUTH] Using validated user ID:', validUserId)
        }
      } catch (err) {
        console.error('[AUTH ERROR] Error validating user ID:', err.message)
      }
    }

    let sourceFile, targetFile
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      // Handle JSON request with file paths
      const { source, target } = await request.json()
      console.log('[API] Received JSON request with paths:', { source, target })

      // Read files from public directory
      const publicDir = path.join(process.cwd(), 'public')

      // Normalize paths
      const sourcePathWithoutLeadingSlash = source.startsWith('/') ? source.substring(1) : source
      const targetPathWithoutLeadingSlash = target.startsWith('/') ? target.substring(1) : target

      const sourcePath = path.join(publicDir, sourcePathWithoutLeadingSlash)
      const targetPath = path.join(publicDir, targetPathWithoutLeadingSlash)

      // Validate file existence
      if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
        return NextResponse.json(
          {
            status: 'error',
            errorType: ERROR_TYPES.VALIDATION,
            message: 'Source or target file not found',
            details: {
              sourcePath: sourcePath,
              targetPath: targetPath,
              exists: {
                source: fs.existsSync(sourcePath),
                target: fs.existsSync(targetPath),
              },
            },
          },
          { status: 404 }
        )
      }

      // Create file-like objects
      sourceFile = {
        name: path.basename(sourcePathWithoutLeadingSlash),
        type: sourcePathWithoutLeadingSlash.endsWith('.png') ? 'image/png' : 'image/jpeg',
        buffer: fs.readFileSync(sourcePath),
        path: sourcePath,
      }

      targetFile = {
        name: path.basename(targetPathWithoutLeadingSlash),
        type: targetPathWithoutLeadingSlash.match(/\.(mp4|webm|mov)$/i)
          ? 'video/mp4'
          : 'image/jpeg',
        buffer: fs.readFileSync(targetPath),
        path: targetPath,
      }
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await request.formData()

      // Get source and target files from form data
      const sourceFormFile = formData.get('source')
      const targetFormFile = formData.get('target')

      if (!sourceFormFile || !targetFormFile) {
        return NextResponse.json(
          {
            status: 'error',
            errorType: ERROR_TYPES.VALIDATION,
            message: 'Source and target files are required',
            details: {
              received: {
                source: !!sourceFormFile,
                target: !!targetFormFile,
              },
            },
          },
          { status: 400 }
        )
      }

      // Process source file
      sourceFile = {
        name: sourceFormFile.name,
        type: sourceFormFile.type,
        buffer: Buffer.from(await sourceFormFile.arrayBuffer()),
      }

      // Process target file
      targetFile = {
        name: targetFormFile.name,
        type: targetFormFile.type,
        buffer: Buffer.from(await targetFormFile.arrayBuffer()),
      }
    } else {
      return NextResponse.json(
        {
          status: 'error',
          errorType: ERROR_TYPES.VALIDATION,
          message: 'Unsupported content type',
          details: {
            receivedContentType: contentType,
            supportedTypes: ['application/json', 'multipart/form-data'],
          },
        },
        { status: 400 }
      )
    }

    console.log('[API] Processing files:', sourceFile.name, targetFile.name)

    // Step 1: Create face fusion task
    const outputPath = await createFusionTask(sourceFile, targetFile)
    console.log('[API] Fusion task created with output path:', outputPath)

    // Step 2: Poll for results and handle the completed task
    const result = await pollAndProcessResult(outputPath, sourceFile, targetFile, { validUserId })

    // Return the result to the client
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API ERROR] Face fusion process failed:', error)

    // Determine error type from error message or default to UNKNOWN
    let errorType = ERROR_TYPES.UNKNOWN
    if (error.message?.includes('validation')) errorType = ERROR_TYPES.VALIDATION
    else if (error.message?.includes('API')) errorType = ERROR_TYPES.API
    else if (error.message?.includes('processing')) errorType = ERROR_TYPES.PROCESSING
    else if (error.message?.includes('download')) errorType = ERROR_TYPES.DOWNLOAD
    else if (error.message?.includes('optimization')) errorType = ERROR_TYPES.OPTIMIZATION
    else if (error.message?.includes('database')) errorType = ERROR_TYPES.DATABASE

    return NextResponse.json(
      {
        status: 'error',
        errorType: errorType,
        message: error.message || 'An error occurred during processing',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now().toString(36)}`,
      },
      { status: 500 }
    )
  }
}

// Create a face fusion task by uploading source and target files
async function createFusionTask(sourceFile, targetFile) {
  try {
    console.log('[CREATE] Creating fusion task with source and target files')
    // Create a new FormData instance for the API request
    const apiFormData = new FormData()

    // Validate files
    if (!sourceFile?.buffer || !targetFile?.buffer) {
      throw new Error(
        `Validation error: Missing file buffer - source: ${!!sourceFile?.buffer}, target: ${!!targetFile?.buffer}`
      )
    }

    // Add files to form data
    apiFormData.append('source', sourceFile.buffer, {
      filename: sourceFile.name,
      contentType: sourceFile.type || 'image/jpeg',
    })

    apiFormData.append('target', targetFile.buffer, {
      filename: targetFile.name,
      contentType: targetFile.type || 'image/jpeg',
    })

    console.log('[CREATE] Sending request to API:', CREATE_API)

    if (!CREATE_API) {
      throw new Error(
        `API configuration error: Missing CREATE_API endpoint in environment variables`
      )
    }

    // Call the CREATE_API with timeout handling
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(CREATE_API, {
        method: 'POST',
        body: apiFormData,
        headers: apiFormData.getHeaders && apiFormData.getHeaders(),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CREATE ERROR] API error:', errorText)
        throw new Error(
          `API error: Failed to create fusion task: ${response.status} - ${errorText}`
        )
      }

      // Extract the output_path from the response
      const data = await response.json()
      console.log('[CREATE] Task created successfully. Response:', data)

      if (!data.output_path) {
        throw new Error('API error: No output_path received from create task API')
      }

      return data.output_path
    } catch (fetchError) {
      clearTimeout(timeout)
      if (fetchError.name === 'AbortError') {
        throw new Error('API error: Request timed out after 30 seconds')
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[CREATE ERROR] Error creating fusion task:', error)

    // Enhance error with type for better client handling
    const enhancedError = new Error(error.message)
    enhancedError.errorType = error.message.includes('Validation')
      ? ERROR_TYPES.VALIDATION
      : ERROR_TYPES.API

    throw enhancedError
  }
}

// saveResultToDatabase function has been replaced by functionality in pollAndProcessResult

// pollForResults function has been replaced by functionality in pollAndProcessResult

async function pollAndProcessResult(outputPath, sourceFile, targetFile, request = {}) {
  let retryCount = 0
  let lastError = null
  let progressPercentage = 0

  console.log(`[POLL] Starting to poll for results with outputPath: ${outputPath}`)
  console.log(`[POLL] Using QUERY_API endpoint: ${QUERY_API}`)

  if (!QUERY_API) {
    throw new Error(`API configuration error: Missing QUERY_API endpoint in environment variables`)
  }

  while (retryCount < MAX_RETRIES) {
    // Calculate and log progress percentage
    progressPercentage = Math.round((retryCount / MAX_RETRIES) * 100)
    console.log(
      `[POLL] Progress: ${progressPercentage}% (Attempt ${retryCount + 1}/${MAX_RETRIES})`
    )

    try {
      console.log(
        `[POLL] Attempt ${retryCount + 1}/${MAX_RETRIES}: Querying API with output_path: ${outputPath}`
      )

      // Make the API request to check status
      const response = await fetch(QUERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ output_path: outputPath }),
      })

      console.log(
        `[POLL] API Response received - Status: ${response.status} ${response.statusText}`
      )

      // Check response content type
      const contentType = response.headers.get('content-type')

      // If response is JSON, it's a status update or error
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log('[POLL] Parsed JSON response:', data)

        if (data.status === 'processing' || data.status === 'pending') {
          // Still processing, wait and retry
          console.log(`[POLL] Task still ${data.status}, waiting before next poll...`)
          retryCount++
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
          continue
        } else if (data.status === 'completed') {
          // Task completed with a JSON response containing output_url
          console.log('[POLL] Task completed successfully with URL in response:', data)

          // Start download process with the output_url from the response
          const outputUrl = data.output_url || outputPath
          // Get user ID from parent scope
          const validUserId = request.validUserId
          return await processCompletedTask(
            outputUrl,
            sourceFile,
            targetFile,
            outputPath,
            validUserId
          )
        } else if (data.status === 'failed') {
          // Task failed with an error
          const errorMessage = data.error || 'Unknown processing error'
          console.error('[POLL] Task failed:', errorMessage)

          // Try to categorize the error for better client handling
          let errorType = ERROR_TYPES.PROCESSING
          if (
            errorMessage.toLowerCase().includes('face detection') ||
            errorMessage.toLowerCase().includes('no faces')
          ) {
            errorType = ERROR_TYPES.PROCESSING
          }

          return {
            status: 'error',
            errorType: errorType,
            message: errorMessage,
            details: {
              outputPath,
              sourceFile: sourceFile.name,
              targetFile: targetFile.name,
              attempts: retryCount + 1,
              timestamp: new Date().toISOString(),
            },
          }
        } else {
          // Unknown status
          console.warn(`[POLL] Unknown task status: ${data.status}`)
          retryCount++
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
          continue
        }
      } else if (response.status === 200) {
        // Non-JSON response with 200 status means the file is ready
        console.log('[POLL] Received direct binary response - file is ready')

        // Generate filename
        const fileExtension = getFileExtensionFromContentType(contentType)
        const outputFilename = `${path.parse(sourceFile.name).name}_${Date.now()}${fileExtension}`

        // Ensure outputs directory exists
        const outputsDir = path.join(process.cwd(), 'public', 'outputs')
        if (!fs.existsSync(outputsDir)) {
          fs.mkdirSync(outputsDir, { recursive: true })
        }

        // File path for saving
        const filePath = path.join(outputsDir, outputFilename)

        // Get file data
        const fileData = await response.arrayBuffer()
        const fileBuffer = Buffer.from(fileData)
        const fileSize = fileBuffer.length

        // Write file to disk
        fs.writeFileSync(filePath, fileBuffer)
        console.log(`[POLL] File saved successfully at: ${filePath}`)

        // Verify file exists
        if (!fs.existsSync(filePath)) {
          throw new Error(`Failed to save file to ${filePath}`)
        }

        // Extract file extension from target file
        const fileType = targetFile.name.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'

        // Try to extract IDs from file paths
        let faceSourceId = null
        let templateId = null

        // Extract source face ID if it exists in path
        if (sourceFile.path) {
          const sourcePathMatch = sourceFile.path.match(/\/sources\/([a-f0-9-]+)/i)
          if (sourcePathMatch && sourcePathMatch[1]) {
            try {
              const faceSource = await prisma.faceSource.findUnique({
                where: { id: sourcePathMatch[1] },
                select: { id: true },
              })
              if (faceSource) {
                faceSourceId = faceSource.id
              }
            } catch (err) {
              console.error('[DB ERROR] Error looking up face source:', err.message)
            }
          }
        }

        // Extract template ID if it exists in path
        if (targetFile.path) {
          const targetPathMatch = targetFile.path.match(/\/templates\/([a-f0-9-]+)/i)
          if (targetPathMatch && targetPathMatch[1]) {
            try {
              const template = await prisma.targetTemplate.findUnique({
                where: { id: targetPathMatch[1] },
                select: { id: true },
              })
              if (template) {
                templateId = template.id
              }
            } catch (err) {
              console.error('[DB ERROR] Error looking up template:', err.message)
            }
          }
        }

        // For videos, apply optimization to improve loading performance
        let finalFilePath = filePath
        let finalFileSize = fileSize
        let thumbnailPath = null

        if (fileType === 'video') {
          // Step 1: Optimize video if enabled
          if (VIDEO_OPTIMIZATION_ENABLED) {
            try {
              console.log(`[OPTIMIZATION] Starting video optimization for: ${filePath}`)

              // Create optimized version in outputs/optimized folder
              const optimizedResult = await optimizeVideo(filePath, {
                ...VIDEO_OPTIMIZATION_CONFIG,
                outputPath: path.join(outputsDir, 'optimized', outputFilename),
              })

              console.log(
                `[OPTIMIZATION] Video optimized successfully: ${optimizedResult.outputPath}`
              )

              // Update to use the optimized version
              finalFilePath = optimizedResult.outputPath
              finalFileSize = fs.statSync(finalFilePath).size
              thumbnailPath = optimizedResult.thumbnailPath
            } catch (optError) {
              console.error(`[OPTIMIZATION ERROR] Failed to optimize video: ${optError.message}`)
            }
          }
        }

        // Create database record using helper function
        const dbRecord = await createGeneratedMediaRecord({
          outputFilename,
          fileType,
          outputPath,
          finalFilePath,
          thumbnailPath,
          finalFileSize,
          contentType: null, // No content type in this case
          faceSourceId,
          templateId,
          userId: request.validUserId,
        })

        // Return success response
        return {
          status: 'success',
          message: 'Face fusion completed successfully',
          filePath: `/outputs/${path.basename(finalFilePath)}`,
          thumbnailPath: thumbnailPath
            ? `/outputs/thumbnails/${path.basename(thumbnailPath)}`
            : null,
          fileSize: Number(fileSize),
          id: dbRecord.id,
        }
      } else {
        // Unexpected response status
        console.warn(`[POLL] Unexpected response status: ${response.status}`)
        retryCount++
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
      }
    } catch (error) {
      console.error('[POLL ERROR] Error during polling:', error)

      // For network errors, retry
      if (error.name === 'FetchError') {
        console.log('[POLL] Network error, retrying...')
        retryCount++
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL))
      } else {
        // For other errors, fail the process
        return {
          status: 'error',
          errorType: ERROR_TYPES.PROCESSING,
          message: `Polling error: ${error.message}`,
        }
      }
    }
  }

  // If we've reached maximum retries
  console.error(`[POLL ERROR] Maximum retries (${MAX_RETRIES}) reached without success`)
  return {
    status: 'error',
    errorType: ERROR_TYPES.PROCESSING,
    message: `Task timed out after ${(MAX_RETRIES * POLLING_INTERVAL) / 1000} seconds`,
  }
}

// Process a completed task by downloading and saving the generated media
async function processCompletedTask(outputUrl, sourceFile, targetFile, outputPath, userId = null) {
  try {
    // Create full URL if needed
    const fullUrl = outputUrl.startsWith('http')
      ? outputUrl
      : `${QUERY_API}?output_path=${encodeURIComponent(outputUrl)}`

    console.log(`[DOWNLOAD] Using full URL: ${fullUrl}`)

    // Download the file
    const response = await fetch(fullUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`)
    }

    // Extract file extension from content type
    const contentType = response.headers.get('content-type')
    const fileExtension = getFileExtensionFromContentType(contentType)

    // Generate filename based on source file
    const outputFilename = `${path.parse(sourceFile.name).name}_${Date.now()}${fileExtension}`

    // Ensure outputs directory exists
    const outputsDir = path.join(process.cwd(), 'public', 'outputs')
    await ensureDirectoryExists(outputsDir)

    // Determine file type from content type
    const fileType = contentType?.includes('video') ? 'video' : 'image'

    // Define file path
    const filePath = path.join(outputsDir, outputFilename)

    // Write the file to disk
    const fileBuffer = await response.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(fileBuffer))
    const fileSize = fs.statSync(filePath).size

    // Process video-specific tasks (optimization, thumbnail generation)
    let finalFilePath = filePath
    let finalFileSize = fileSize
    let thumbnailPath = null

    if (fileType === 'video') {
      // Step 1: Optimize video if enabled
      if (VIDEO_OPTIMIZATION_ENABLED) {
        try {
          console.log(`[OPTIMIZATION] Starting video optimization for: ${filePath}`)

          // Create optimized version in outputs/optimized folder
          const optimizedResult = await optimizeVideo(filePath, {
            ...VIDEO_OPTIMIZATION_CONFIG,
            outputPath: path.join(outputsDir, 'optimized', outputFilename),
          })

          console.log(`[OPTIMIZATION] Video optimized successfully: ${optimizedResult.outputPath}`)

          // Update to use the optimized version
          finalFilePath = optimizedResult.outputPath
          finalFileSize = fs.statSync(finalFilePath).size
          thumbnailPath = optimizedResult.thumbnailPath
        } catch (optError) {
          console.error(`[OPTIMIZATION ERROR] Failed to optimize video: ${optError.message}`)
          // Continue with the original video if optimization fails

          // Try to generate just a thumbnail if optimization failed
          try {
            thumbnailPath = await generateVideoThumbnail(filePath)
            console.log(`[THUMBNAIL] Generated thumbnail at: ${thumbnailPath}`)
          } catch (thumbError) {
            console.error(`[THUMBNAIL ERROR] Failed to generate thumbnail: ${thumbError.message}`)
          }
        }
      }
    }

    // Try to extract IDs from file paths
    let faceSourceId = null
    let templateId = null

    // Extract source face ID if it exists in path
    if (sourceFile.path) {
      const sourcePathMatch = sourceFile.path.match(/\/sources\/([a-f0-9-]+)/i)
      if (sourcePathMatch && sourcePathMatch[1]) {
        try {
          const faceSource = await prisma.faceSource.findUnique({
            where: { id: sourcePathMatch[1] },
            select: { id: true },
          })
          if (faceSource) {
            faceSourceId = faceSource.id
          }
        } catch (err) {
          console.error('[DB ERROR] Error looking up face source:', err.message)
        }
      }
    }

    // Extract template ID if it exists in path
    if (targetFile.path) {
      const targetPathMatch = targetFile.path.match(/\/templates\/([a-f0-9-]+)/i)
      if (targetPathMatch && targetPathMatch[1]) {
        try {
          const template = await prisma.targetTemplate.findUnique({
            where: { id: targetPathMatch[1] },
            select: { id: true },
          })
          if (template) {
            templateId = template.id
          }
        } catch (err) {
          console.error('[DB ERROR] Error looking up template:', err.message)
        }
      }
    }

    // Create database record using helper function
    const dbRecord = await createGeneratedMediaRecord({
      outputFilename,
      fileType,
      outputPath,
      finalFilePath,
      thumbnailPath,
      finalFileSize,
      contentType,
      faceSourceId,
      templateId,
      userId,
    })

    // Return success response
    return {
      status: 'success',
      filePath: `/outputs/${path.basename(finalFilePath)}`,
      thumbnailPath: thumbnailPath ? `/outputs/thumbnails/${path.basename(thumbnailPath)}` : null,
      name: outputFilename,
      type: fileType,
      id: dbRecord.id,
      fileSize: finalFileSize,
    }
  } catch (error) {
    console.error('[PROCESS ERROR]', error)
    return {
      status: 'error',
      errorType: ERROR_TYPES.PROCESSING,
      message: `Processing error: ${error.message}`,
    }
  }
}

/**
 * Helper function to create a database record for generated media
 */
async function createGeneratedMediaRecord({
  outputFilename,
  fileType,
  outputPath,
  finalFilePath,
  thumbnailPath,
  finalFileSize,
  contentType,
  faceSourceId,
  templateId,
  userId,
}) {
  // Prepare paths for database storage
  const relativeFilePath = `/outputs/${path.basename(finalFilePath)}`
  const relativeThumbnailPath = thumbnailPath
    ? `/outputs/thumbnails/${path.basename(thumbnailPath)}`
    : null

  // Create database record
  const dbRecord = await prisma.generatedMedia.create({
    data: {
      name: outputFilename,
      type: fileType,
      tempPath: outputPath,
      filePath: relativeFilePath,
      thumbnailPath: fileType === 'video' ? relativeThumbnailPath : null,
      fileSize: BigInt(finalFileSize),
      mimeType: contentType || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
      isPaid: false,
      faceSourceId: faceSourceId,
      templateId: templateId,
      authorId: userId, // Set the author ID from the logged-in user
    },
  })

  console.log('[DB] Database record created:', serializeBigInt(dbRecord))

  return dbRecord
}

// Helper function to determine file extension from content-type
function getFileExtensionFromContentType(contentType) {
  if (!contentType) return '.mp4' // Default to mp4

  if (contentType.includes('video/mp4')) return '.mp4'
  if (contentType.includes('image/png')) return '.png'
  if (contentType.includes('image/jpeg')) return '.jpg'

  // Extract extension from content-disposition if available
  // For simplicity, we're using the default extension based on content-type
  return '.mp4'
}

/**
 * Helper function to determine MIME type from file extension
 */
function getMimeTypeFromExtension(extension) {
  const ext = extension.toLowerCase()

  // Map common extensions to MIME types
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.webm':
      return 'video/webm'
    default:
      // If we can't determine the MIME type, make a guess based on the extension
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return 'image/jpeg' // Default to JPEG for images
      }
      return 'video/mp4' // Default to MP4 for everything else
  }
}

// Helper function to check if content is a binary media file by looking for common signatures
function isBinaryMediaFile(content) {
  if (!content) return false

  try {
    // Handle different content types
    let str
    if (Buffer.isBuffer(content)) {
      str = content.toString('binary', 0, 200)
    } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      str = String.fromCharCode.apply(null, new Uint8Array(content).slice(0, 200))
    } else if (typeof content === 'string') {
      str = content.substring(0, 200)
    } else {
      str = String(content).substring(0, 200)
    }

    // MP4/MOV file signatures (ISO media format)
    if (
      str.includes('ftyp') ||
      str.includes('mdat') ||
      str.includes('moov') ||
      str.includes('pnot') ||
      str.includes('wide')
    ) {
      return true
    }

    // JPEG signatures
    if (str.includes('\xFF\xD8\xFF')) {
      return true
    }

    // PNG signature
    if (str.includes('PNG')) {
      return true
    }

    // WebM/MKV signatures
    if (str.includes('\x1A\x45\xDF\xA3') || str.includes('webm') || str.includes('matroska')) {
      return true
    }

    // MP3 signatures
    if (
      str.includes('ID3') ||
      str.includes('\xFF\xFB') ||
      str.includes('\xFF\xF3') ||
      str.includes('\xFF\xF2') ||
      str.includes('\xFF\xFA')
    ) {
      return true
    }

    // Look for non-printable characters which suggest binary content
    const nonPrintableCount = Array.from(str).filter(char => {
      const code = char.charCodeAt(0)
      return (code < 32 || code > 126) && code !== 10 && code !== 13 && code !== 9
    }).length

    // If more than 20% of the first 200 chars are non-printable, likely binary
    if (nonPrintableCount > str.length * 0.2) {
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking for binary media file:', error)
    return false
  }
}

// downloadAndSaveGeneratedMedia function has been replaced by functionality in pollAndProcessResult
// and processCompletedTask
