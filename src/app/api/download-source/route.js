import { NextResponse } from 'next/server'
import { supabase } from '@/utils/storage-helper'
import { getFaceSourceByFilename } from '@/lib/supabase-db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the face source exists
    const faceSource = await getFaceSourceByFilename(filename)

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Get the file path from the face source
    const filePath = faceSource.file_path || faceSource.filePath

    if (!filePath) {
      return NextResponse.json(
        {
          error: 'File path not found in face source record',
          faceSourceId: faceSource.id,
          filename,
        },
        { status: 400 }
      )
    }

    // Handle different file path formats
    let bucket, path

    if (filePath.includes('/')) {
      // Format: "bucket/path" or "bucket/subfolder/file"
      const [bucketPart, ...pathParts] = filePath.split('/')
      bucket = bucketPart
      path = pathParts.join('/')
    } else {
      // Format: just filename, assume it's in face-sources bucket
      bucket = 'face-sources'
      path = filePath
    }

    if (!bucket || !path) {
      return NextResponse.json(
        {
          error: 'Invalid file path',
          filePath: filePath,
          bucket,
          path,
        },
        { status: 400 }
      )
    }

    // Download from Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      return NextResponse.json(
        {
          error: 'File not found in storage',
          details: error.message,
          bucket,
          path,
        },
        { status: 404 }
      )
    }

    // Convert the blob to buffer
    const arrayBuffer = await data.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': faceSource.mime_type || faceSource.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading face source:', error)
    return NextResponse.json(
      {
        error: 'Failed to download face source',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
