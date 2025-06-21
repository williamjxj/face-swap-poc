import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import fs from 'fs'
import path from 'path'

// GET all generated media
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // Construct where clause with isActive filter and optional type filter
    const whereClause = {
      isActive: true,
      ...(typeFilter ? { type: typeFilter } : {}),
    }

    const media = await prisma.generatedMedia.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
      include: {
        targetTemplate: { select: { type: true } },
        faceSource: { select: { id: true, filename: true } },
      },
    })

    // Convert BigInt values to strings
    const serializedMedia = media.map(item => ({
      ...item,
      fileSize: item.fileSize.toString(),
      mimeType: item.mimeType || 'video/mp4', // Provide default mimeType if not set
      // GeneratedMedia doesn't have thumbnailPath field, so always use placeholder
      thumbnailPath: '/placeholder-thumbnail.svg',
    }))

    return NextResponse.json({ files: serializedMedia })
  } catch (error) {
    console.error('Error fetching generated media:', error)
    return NextResponse.json({ error: 'Failed to fetch generated media' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'public', 'outputs', filename)

    try {
      // Check if file exists before deleting
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      } else {
        console.warn(`Warning: File not found for deletion: ${filePath}`)
      }
    } catch (error) {
      console.warn('Warning: Could not delete output file:', error)
      // Continue with operation even if file deletion fails
    }

    // Optionally, delete from generatedMedia table as well
    await prisma.generatedMedia.deleteMany({ where: { name: filename } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting generated media:', error)
    return NextResponse.json({ error: 'Failed to delete generated media' }, { status: 500 })
  }
}
