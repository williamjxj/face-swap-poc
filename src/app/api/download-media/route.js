import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { supabase } from '@/utils/storage-helper'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the video exists and is paid
    const media = await prisma.generatedMedia.findFirst({
      where: { name: filename },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    if (!media.isPaid) {
      return NextResponse.json({ error: 'Media is not paid for' }, { status: 403 })
    }

    // Download from Supabase Storage
    const [bucket, ...pathParts] = media.filePath.split('/')
    const path = pathParts.join('/')

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      console.error('Error downloading from Supabase Storage:', error)
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    // Convert the blob to buffer
    const arrayBuffer = await data.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

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
