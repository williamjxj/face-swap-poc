import { NextResponse } from 'next/server'
import path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { db } from '@/lib/db'
import { getValidatedUserId, logSessionDebugInfo } from '@/utils/auth-helper'
import { uploadFile, getStorageUrl } from '@/utils/storage-helper'

// Environment variables for API endpoints (configure in .env.local)
const CREATE_API = process.env.MODAL_CREATE_API
const QUERY_API = process.env.MODAL_QUERY_API

// Maximum number of retry attempts for polling
const MAX_RETRIES = 60 // 6 minutes maximum (8 seconds × 60)
const POLLING_INTERVAL = 8000 // 8 seconds

// Video optimization disabled for serverless compatibility

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
    // Log session debug info to help troubleshoot
    await logSessionDebugInfo()

    // Get validated user ID from helper function
    const validUserId = await getValidatedUserId()

    if (validUserId) {
      console.log('[AUTH] Using validated user ID for face fusion:', validUserId)
    } else {
      console.log('[AUTH] No valid user ID found for face fusion')
    }

    let sourceFile, targetFile
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      // Handle JSON request with file paths
      const { source, target } = await request.json()
      console.log('[API] Received JSON request with paths:', { source, target })

      // Read files from Supabase Storage
      // Check if source is a Supabase Storage path (bucket/path format)
      let sourceBuffer, targetBuffer

      try {
        // Get source file from Supabase Storage
        const sourceUrl = await getStorageUrl(source)
        if (!sourceUrl) {
          throw new Error(`Source file not found in storage: ${source}`)
        }

        const sourceResponse = await fetch(sourceUrl)
        if (!sourceResponse.ok) {
          throw new Error(`Failed to fetch source file: ${sourceResponse.status}`)
        }
        sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer())

        // Get target file from Supabase Storage
        const targetUrl = await getStorageUrl(target)
        if (!targetUrl) {
          throw new Error(`Target file not found in storage: ${target}`)
        }

        const targetResponse = await fetch(targetUrl)
        if (!targetResponse.ok) {
          throw new Error(`Failed to fetch target file: ${targetResponse.status}`)
        }
        targetBuffer = Buffer.from(await targetResponse.arrayBuffer())
      } catch (error) {
        return NextResponse.json(
          {
            status: 'error',
            errorType: ERROR_TYPES.VALIDATION,
            message: 'Source or target file not found in storage',
            details: {
              source: source,
              target: target,
              error: error.message,
            },
          },
          { status: 404 }
        )
      }

      // Create file-like objects
      sourceFile = {
        name: path.basename(source),
        type: source.endsWith('.png') ? 'image/png' : 'image/jpeg',
        buffer: sourceBuffer,
        path: source,
      }

      targetFile = {
        name: path.basename(target),
        type: target.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg',
        buffer: targetBuffer,
        path: target,
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

/**
 * Create a face fusion task by uploading source and target files to the remote API
 * @param {Object} sourceFile - Source face image file
 * @param {Object} targetFile - Target video/image file
 * @returns {Promise<string>} Output path for the created task
 */
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
        `API configuration error: Missing CREATE API endpoint in environment variables`
      )
    }

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

/**
 * Poll for task completion and process the result when ready
 * @param {string} outputPath - Path to poll for results
 * @param {Object} sourceFile - Source file information
 * @param {Object} targetFile - Target file information
 * @param {Object} request - Request context with user information
 * @returns {Promise<Object>} Processing result
 */
async function pollAndProcessResult(outputPath, sourceFile, targetFile, request = {}) {
  let retryCount = 0
  let progressPercentage = 0

  console.log(`[POLL] Starting to poll for results with outputPath: ${outputPath}`)
  console.log(`[POLL] Using QUERY API endpoint: ${QUERY_API}`)

  if (!QUERY_API) {
    throw new Error(`API configuration error: Missing QUERY API endpoint in environment variables`)
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

        // Get file data
        const fileData = await response.arrayBuffer()
        const fileBuffer = Buffer.from(fileData)
        const fileSize = fileBuffer.length

        // Upload to Supabase Storage
        const storagePath = `generated-outputs/${outputFilename}`
        const uploadResult = await uploadFile(fileBuffer, storagePath, {
          contentType: contentType || 'video/mp4',
          fileName: outputFilename,
        })

        if (!uploadResult.success) {
          throw new Error(`Failed to upload file to storage: ${uploadResult.error}`)
        }

        console.log(`[STORAGE] File uploaded successfully to: ${storagePath}`)

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
              const faceSource = await db.faceSource.findUnique({
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
              const template = await db.targetTemplate.findUnique({
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
        let finalStoragePath = storagePath
        let finalFileSize = fileSize

        // Video optimization disabled for serverless compatibility
        // Videos are uploaded directly to storage without local processing

        // Create database record using helper function
        const dbRecord = await createGeneratedMediaRecord({
          outputFilename,
          fileType,
          outputPath,
          finalStoragePath,
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
          filePath: finalStoragePath,
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

/**
 * Process a completed task by downloading and saving the generated media
 * @param {string} outputUrl - URL to download the result
 * @param {Object} sourceFile - Source file information
 * @param {Object} targetFile - Target file information
 * @param {string} outputPath - Original output path
 * @param {string|null} userId - User ID for database association
 * @returns {Promise<Object>} Processing result with file information
 */
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

    // Determine file type from content type
    const fileType = contentType?.includes('video') ? 'video' : 'image'

    // Get the file data
    const fileBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)
    const fileSize = buffer.length

    // Upload to Supabase Storage
    const storagePath = `generated-outputs/${outputFilename}`
    const uploadResult = await uploadFile(buffer, storagePath, {
      contentType: contentType || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
      fileName: outputFilename,
    })

    if (!uploadResult.success) {
      throw new Error(`Failed to upload file to storage: ${uploadResult.error}`)
    }

    console.log(`[STORAGE] File uploaded successfully to: ${storagePath}`)

    // Process video-specific tasks (optimization, thumbnail generation)
    let finalStoragePath = storagePath
    let finalFileSize = fileSize

    // Video optimization disabled for serverless compatibility
    // Videos are uploaded directly to storage without local processing

    // Try to extract IDs from file paths
    let faceSourceId = null
    let templateId = null

    // Extract source face ID if it exists in path
    if (sourceFile.path) {
      const sourcePathMatch = sourceFile.path.match(/\/sources\/([a-f0-9-]+)/i)
      if (sourcePathMatch && sourcePathMatch[1]) {
        try {
          const faceSource = await db.faceSource.findUnique({
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
          const template = await db.targetTemplate.findUnique({
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
      finalStoragePath,
      finalFileSize,
      contentType,
      faceSourceId,
      templateId,
      userId, // Use the userId parameter passed to the function
    })

    // Return success response
    return {
      status: 'success',
      filePath: finalStoragePath,
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
  finalStoragePath,
  finalFileSize,
  contentType,
  faceSourceId,
  templateId,
  userId,
}) {
  // Create database record
  const dbRecord = await db.generatedMedia.create({
    data: {
      name: outputFilename,
      type: fileType,
      tempPath: outputPath,
      filePath: finalStoragePath,
      fileSize: BigInt(finalFileSize),
      mimeType: contentType || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
      isPaid: false,
      faceSourceId: faceSourceId,
      templateId: templateId,
      authorId: userId, // Set the author ID from the validated user ID
    },
  })

  if (userId) {
    console.log('[DB] Generated media associated with user ID:', userId)
  } else {
    console.log('[DB] Warning: Generated media created without author ID')
  }

  return dbRecord
}

/**
 * Helper function to determine file extension from HTTP content-type header
 * @param {string|null} contentType - HTTP content-type header value
 * @returns {string} File extension with leading dot
 */
function getFileExtensionFromContentType(contentType) {
  if (!contentType) return '.mp4' // Default to mp4

  if (contentType.includes('video/mp4')) return '.mp4'
  if (contentType.includes('image/png')) return '.png'
  if (contentType.includes('image/jpeg')) return '.jpg'

  return '.mp4' // Default fallback
}
