import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getValidatedUserId, logSessionDebugInfo } from '@/utils/auth-helper'
import { uploadFile, deleteFile, STORAGE_BUCKETS } from '@/utils/storage-helper'
import sharp from 'sharp'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`

    // Upload to Supabase Storage
    const filePath = `${STORAGE_BUCKETS.FACE_SOURCES}/${filename}`

    const uploadResult = await uploadFile(buffer, filePath, {
      contentType: file.type,
      cacheControl: '3600',
    })

    if (!uploadResult.success) {
      return NextResponse.json({ error: `Upload failed: ${uploadResult.error}` }, { status: 500 })
    }

    console.log('File uploaded successfully to:', filePath)

    // Get image dimensions using sharp
    let width = 0
    let height = 0
    try {
      const metadata = await sharp(buffer).metadata()
      width = metadata.width || 0
      height = metadata.height || 0
      console.log(`Image dimensions: ${width}x${height}`)
    } catch (error) {
      console.error('Error getting image dimensions:', error)
      // Continue with default dimensions
    }

    // Log session debug info to help troubleshoot
    await logSessionDebugInfo()

    // Get validated user ID from helper function
    const authorId = await getValidatedUserId()

    // Create database record
    if (!db) {
      console.error('Database client is not initialized')
      return NextResponse.json({ error: 'Database client is not initialized' }, { status: 500 })
    }

    const faceSourceData = {
      filename: filename,
      width: width,
      height: height,
      filePath: filePath, // Store Supabase Storage path (e.g., "face-sources/123456_image.png")
      fileSize: BigInt(file.size),
      mimeType: file.type,
      authorId: authorId,
    }

    console.log('Creating face source record with data:', {
      ...faceSourceData,
      fileSize: faceSourceData.fileSize.toString(), // Convert BigInt to string for logging
    })

    try {
      const faceSource = await db.faceSource.create({
        data: faceSourceData,
      })

      console.log('FaceSource created successfully:', faceSource)

      return NextResponse.json({
        id: faceSource.id,
        filename: faceSource.filename,
        filePath: faceSource.filePath,
        width: faceSource.width,
        height: faceSource.height,
        fileSize: faceSource.fileSize.toString(),
        mimeType: faceSource.mimeType,
      })
    } catch (error) {
      console.error('Error creating database record:', error.message)
      console.error('Error stack:', error.stack)

      // If database creation fails, try to clean up the uploaded file
      try {
        await deleteFile(filePath)
        console.log('Cleaned up uploaded file after database error')
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }

      return NextResponse.json(
        {
          error: `Failed to create database record: ${error.message}`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error uploading face source:', error)
    console.error('Error stack:', error.stack)

    // Create a detailed error message
    const errorMessage = error.message || 'Failed to upload face source'
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

// Add GET endpoint to list face sources
export async function GET() {
  try {
    // Get all face sources, ordered by most recent first
    const faceSources = await db.faceSource.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert BigInt to strings for JSON response
    const faceSourcesWithStringFileSize = faceSources.map(source => ({
      ...source,
      fileSize: source.fileSize.toString(),
      createdAt: source.createdAt.toISOString(),
      lastUsedAt: source.lastUsedAt ? source.lastUsedAt.toISOString() : null,
    }))

    return NextResponse.json({ faceSources: faceSourcesWithStringFileSize })
  } catch (error) {
    console.error('Error fetching face sources:', error)
    return NextResponse.json({ error: 'Failed to fetch face sources' }, { status: 500 })
  }
}

// Add DELETE endpoint
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Face source ID is required' }, { status: 400 })
    }

    // Get face source details before deletion
    const faceSource = await db.faceSource.findUnique({
      where: { id: id },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Delete file from Supabase Storage
    if (faceSource.filePath) {
      try {
        const deleteResult = await deleteFile(faceSource.filePath)
        if (deleteResult.success) {
          console.log(`Successfully deleted file from storage: ${faceSource.filePath}`)
        } else {
          console.error('Error deleting file from storage:', deleteResult.error)
          // Continue with database deletion even if file removal fails
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error)
        // Continue with database deletion even if file removal fails
      }
    }

    // Delete database record
    await db.faceSource.delete({
      where: { id: id },
    })

    return NextResponse.json({
      success: true,
      message: 'Face source deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting face source:', error)
    return NextResponse.json({ error: 'Failed to delete face source' }, { status: 500 })
  }
}
