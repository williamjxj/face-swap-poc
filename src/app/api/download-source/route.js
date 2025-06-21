import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the face source exists
    const faceSource = await prisma.faceSource.findFirst({
      where: {
        filename: filename,
        isActive: true,
      },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Construct file path - face sources are stored in public/sources
    const filePath = path.join(process.cwd(), 'public', 'sources', faceSource.filename)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': faceSource.mimeType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${faceSource.filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading face source:', error)
    return NextResponse.json({ error: 'Failed to download face source' }, { status: 500 })
  }
}
