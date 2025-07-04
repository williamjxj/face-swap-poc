import { NextResponse } from 'next/server'
import { getStorageUrl } from '@/utils/storage-helper'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the face source exists
    const faceSource = await db.faceSource.findFirst({
      where: {
        filename: filename,
        isActive: true,
      },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Get the public URL from Supabase Storage
    const publicUrl = getStorageUrl(faceSource.filePath)

    if (!publicUrl) {
      return NextResponse.json({ error: 'File URL not available' }, { status: 404 })
    }

    // Redirect to the Supabase Storage public URL
    return NextResponse.redirect(publicUrl)
  } catch (error) {
    console.error('Error downloading face source:', error)
    return NextResponse.json({ error: 'Failed to download face source' }, { status: 500 })
  }
}
