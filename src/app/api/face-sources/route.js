import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import db from '@/lib/db'
import { serializeBigInt } from '@/utils/helper'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

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

    // Ensure the sources directory exists
    const sourcesDir = path.join(process.cwd(), 'public', 'sources')
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Process image with Sharp
    const image = sharp(fileBuffer)
    const metadata = await image.metadata()

    // Save the processed image
    await image.toFile(path.join(sourcesDir, filename))

    // Get file metadata
    const filePath = `/sources/${filename}`
    const fileSize = file.size
    const mimeType = file.type

    // Get current user session - null user is allowed
    const session = await getServerSession(authOptions)
    let authorId = null

    if (session?.user?.id) {
      // Verify that the user exists in the database before using the ID
      try {
        const userExists = await db.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        })

        if (userExists) {
          authorId = session.user.id
          console.log('Associating face source with user:', session.user.email)
        } else {
          console.log('User ID from session not found in database:', session.user.id)
          console.log('Will create face source without author ID')
        }
      } catch (userCheckError) {
        console.error('Error checking user existence:', userCheckError)
        console.log('Will create face source without author ID')
      }
    } else {
      console.log('No user session, creating face source without author ID')
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
    const faceSource = await prisma.faceSource.findFirst({
      where: {
        filename: filename,
        isActive: true,
      },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.faceSource.update({
      where: {
        id: faceSource.id,
      },
      data: {
        isActive: false,
      },
    })

    // Delete physical file if it exists
    const filePath = path.join(process.cwd(), 'public', faceSource.filePath)
    try {
      // Check if file exists before attempting to delete
      await fs.access(filePath)
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist or can't be deleted, continue with the DB operation
      console.warn('Warning: Could not delete physical file:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting source:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
