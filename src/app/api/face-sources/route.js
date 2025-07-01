import { NextResponse } from 'next/server'
import path from 'path'
import db from '@/lib/db'
import { serializeBigInt } from '@/utils/helper'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { getValidatedUserId, logSessionDebugInfo } from '@/utils/auth-helper'
import { uploadFile, deleteFile, STORAGE_BUCKETS } from '@/utils/storage-helper'

// Helper function to handle BigInt serialization
const sanitizeBigInt = data => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )
}

// GET all face sources
export async function GET() {
  try {
    const sources = await db.faceSource.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    const serializedSources = serializeBigInt(sources)
    return NextResponse.json({ files: serializedSources })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST new face source
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const extension = path.extname(originalName)
    const filename = `${timestamp}_${uuidv4()}${extension}`

    // Process image with Sharp
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const image = sharp(fileBuffer)
    const metadata = await image.metadata()

    // Optimize and compress the image
    const processedBuffer = await image
      .jpeg({ quality: 90 }) // Convert to JPEG for better compression
      .toBuffer()

    // Upload to Supabase Storage
    const filePath = `${STORAGE_BUCKETS.FACE_SOURCES}/${filename}`
    const uploadResult = await uploadFile(processedBuffer, filePath, {
      contentType: 'image/jpeg',
      overwrite: true,
    })

    if (!uploadResult.success) {
      return NextResponse.json({ error: `Upload failed: ${uploadResult.error}` }, { status: 500 })
    }

    // Get file metadata
    const fileSize = processedBuffer.length
    const mimeType = 'image/jpeg'

    // Log session debug info to help troubleshoot
    await logSessionDebugInfo()

    // Get validated user ID from helper function
    const authorId = await getValidatedUserId()

    if (authorId) {
      console.log('Associating face source with validated user ID:', authorId)
    } else {
      console.log('No valid user ID found, creating face source without author ID')
    }

    // Create record in database with or without authorId
    const faceSourceData = {
      filename,
      filePath,
      fileSize: BigInt(fileSize),
      mimeType,
      width: metadata.width || 0,
      height: metadata.height || 0,
      isActive: true,
      authorId, // This can be null
    }

    console.log('Creating face source record with data:', {
      ...faceSourceData,
      fileSize: faceSourceData.fileSize.toString(), // Convert BigInt to string for logging
    })

    // Add to database
    const faceSource = await db.faceSource.create({
      data: faceSourceData,
    })

    const sanitizedSource = sanitizeBigInt(faceSource)

    return NextResponse.json({
      id: sanitizedSource.id,
      filename: sanitizedSource.filename,
      filePath: sanitizedSource.filePath,
      width: sanitizedSource.width,
      height: sanitizedSource.height,
      fileSize: sanitizedSource.fileSize,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE face source
export async function DELETE(request) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Find the face source record
    const faceSource = await db.faceSource.findFirst({
      where: {
        filename: filename,
        isActive: true,
      },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    // Delete file from Supabase Storage first
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

    // Hard delete from database (completely remove the record)
    await db.faceSource.delete({
      where: {
        id: faceSource.id,
      },
    })

    console.log(`Successfully deleted face source: ${faceSource.filename}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting source:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}
