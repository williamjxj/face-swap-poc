import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import db from '@/lib/db'
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

    // Save to public/sources directory
    const publicDir = path.join(process.cwd(), 'public', 'sources')

    // Ensure directory exists
    try {
      await mkdir(publicDir, { recursive: true })
    } catch (error) {
      console.error('Error creating directory:', error)
      return NextResponse.json({ error: 'Failed to create required directories' }, { status: 500 })
    }

    const filePath = path.join(publicDir, filename)

    // Write file to disk
    try {
      await writeFile(filePath, buffer)
      console.log('File saved successfully:', filePath)
    } catch (error) {
      console.error('Error saving file:', error)
      return NextResponse.json({ error: 'Failed to save uploaded file' }, { status: 500 })
    }

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

    // Get current user session
    const session = await getServerSession(authOptions)
    let authorId = null
    if (session?.user?.id) {
      authorId = session.user.id
      console.log('Associating face source with user:', session.user.email)
    }

    // Create database record
    if (!db) {
      console.error('Database client is not initialized')
      return NextResponse.json({ error: 'Database client is not initialized' }, { status: 500 })
    }

    const faceSourceData = {
      filename: filename,
      width: width,
      height: height,
      filePath: `/sources/${filename}`,
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

      // Return meaningful error but still indicate file was saved
      return NextResponse.json(
        {
          success: true,
          filename: filename,
          filePath: `/sources/${filename}`,
          error: `File was saved but database record could not be created: ${error.message}`,
        },
        { status: 207 }
      ) // 207 Multi-Status indicates partial success
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

    // Delete file
    if (faceSource.filePath) {
      const publicDir = path.join(process.cwd(), 'public')
      const filePath = path.join(publicDir, faceSource.filePath.slice(1))

      try {
        const fs = require('fs').promises
        await fs.unlink(filePath)
        console.log(`Successfully deleted file: ${filePath}`)
      } catch (error) {
        console.error('Error deleting file:', error)
        // Continue with deletion even if file removal fails
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
