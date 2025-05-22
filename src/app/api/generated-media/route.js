import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import fs from 'fs'
import path from 'path'

// GET all generated media
export async function GET(request) {
  try {
    // Parse type filter from query params if provided
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')

    // Construct where clause with isActive filter and optional type filter
    const whereClause = {
      isActive: true,
      ...(typeFilter ? { type: typeFilter } : {}),
    }

    const media = await prisma.generatedMedia.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
      // If item doesn't have a thumbnailPath, try to use the filePath as fallback
      thumbnailPath: item.thumbnailPath || item.filePath,
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

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    fs.unlinkSync(filePath)

    // Optionally, delete from generatedMedia table as well
    await prisma.generatedMedia.deleteMany({ where: { name: filename } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting generated media:', error)
    return NextResponse.json({ error: 'Failed to delete generated media' }, { status: 500 })
  }
}
