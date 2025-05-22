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

    // Check if the video exists and is paid
    const media = await prisma.generatedMedia.findUnique({
      where: { name: filename },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    if (!media.isPaid) {
      return NextResponse.json({ error: 'Media is not paid for' }, { status: 403 })
    }

    const filePath = path.join(process.cwd(), 'public', 'outputs', filename)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': media.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading media:', error)
    return NextResponse.json({ error: 'Failed to download media' }, { status: 500 })
  }
}
