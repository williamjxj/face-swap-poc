import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getValidatedUserId, logSessionDebugInfo } from '@/utils/auth-helper'
import { uploadFile, STORAGE_BUCKETS } from '@/utils/storage-helper'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Validate file type
    const validTypes = [
      'video/mp4',
      'video/wav',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename to avoid conflicts with sanitized name
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'))
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'))

    // Sanitize filename by removing non-ASCII characters and replacing with safe characters
    const sanitizedBaseName =
      baseName
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace remaining special chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '') || // Remove leading/trailing underscores
      'template' // Fallback if name becomes empty

    const filename = `${sanitizedBaseName}_${timestamp}${fileExtension}`

    console.log('Generated unique filename:', filename)

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Determine storage bucket and file paths
    const isVideo = file.type.startsWith('video/')
    const bucket = isVideo ? STORAGE_BUCKETS.TEMPLATE_VIDEOS : STORAGE_BUCKETS.GUIDELINE_IMAGES
    const filePath = `${bucket}/${filename}`

    // Upload main file to Supabase Storage
    const uploadResult = await uploadFile(fileBuffer, filePath, {
      contentType: file.type,
      cacheControl: '3600',
      overwrite: true, // Allow overwriting files with same name
    })

    if (!uploadResult.success) {
      return NextResponse.json({ error: `Upload failed: ${uploadResult.error}` }, { status: 500 })
    }

    console.log('File uploaded successfully to:', filePath)

    // Generate thumbnail for video files
    let thumbnailPath = null
    let duration = null

    if (isVideo) {
      try {
        // For now, we'll set thumbnailPath as null since we're not generating actual thumbnails
        // The UI will handle video preview using the video element directly
        // In a production app, you'd want to use a service like AWS Lambda or similar
        // to process videos and generate actual thumbnails
        thumbnailPath = null
        console.log('Video uploaded, thumbnail will be generated dynamically by UI')
      } catch (error) {
        console.error('Error processing video:', error)
        console.log('Continuing upload process without thumbnail/duration')
      }
    }

    // Create database record
    if (!db) {
      console.error('Database client is not initialized')
      return NextResponse.json({ error: 'Database client is not initialized' }, { status: 500 })
    }

    // Get template type from formData or infer it from file type
    let templateType = formData.get('templateType')

    // If no template type is provided, infer it from file type
    if (!templateType) {
      templateType = file.type.startsWith('video/')
        ? 'video'
        : file.type === 'image/gif'
          ? 'gif'
          : 'image'
    }

    console.log('Template type:', templateType)

    // Log session debug info to help troubleshoot
    await logSessionDebugInfo()

    // Get validated user ID from helper function
    const authorId = await getValidatedUserId()

    if (authorId) {
      console.log('Associating template with validated user ID:', authorId)
    } else {
      console.log('No valid user ID found, creating template without author ID')
    }

    const templateData = {
      filename: originalName, // Store original filename for display
      type: templateType,
      filePath: filePath,
      thumbnailPath: thumbnailPath,
      fileSize: BigInt(file.size),
      mimeType: file.type,
      duration: duration,
      authorId: authorId,
    }

    console.log('Creating template record with data:', templateData)

    try {
      console.log('Attempting to create template with data:', {
        ...templateData,
        fileSize: templateData.fileSize.toString(),
      })

      const template = await db.targetTemplate.create({
        data: templateData,
      })

      console.log('Template created successfully:', template)

      return NextResponse.json({
        id: template.id,
        filename: template.filename,
        filePath: template.filePath,
        thumbnailPath: template.thumbnailPath,
        duration: template.duration,
        fileSize: template.fileSize.toString(),
        mimeType: template.mimeType,
      })
    } catch (error) {
      console.error('Error creating database record:', error.message)
      console.error('Error stack:', error.stack)

      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }
  } catch (error) {
    console.error('Error uploading template:', error)
    console.error('Error stack:', error.stack)

    const errorMessage = error.message || 'Failed to upload template'
    const errorDetails = error.code ? ` (Code: ${error.code})` : ''

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Add GET endpoint to list templates
export async function GET() {
  try {
    const templates = await db.targetTemplate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// Add DELETE endpoint
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get template details before deletion
    const template = await db.targetTemplate.findUnique({
      where: { id: id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete files
    const publicDir = path.join(process.cwd(), 'public')

    // Delete video file
    if (template.filePath) {
      const videoPath = path.join(publicDir, template.filePath.slice(1))
      try {
        await unlink(videoPath)
      } catch (error) {
        console.error('Error deleting video file:', error)
      }
    }

    // Delete thumbnail file
    if (template.thumbnailPath) {
      const thumbnailPath = path.join(publicDir, template.thumbnailPath.slice(1))
      try {
        await unlink(thumbnailPath)
      } catch (error) {
        console.error('Error deleting thumbnail file:', error)
      }
    }

    // Delete database record
    await db.targetTemplate.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
