import { NextResponse } from 'next/server'
import { supabase } from '@/utils/storage-helper'
import { getGeneratedMediaByName } from '@/lib/supabase-db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the video exists and is paid
    const media = await getGeneratedMediaByName(filename)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // For demo/POC: Allow downloads without payment requirement
    // In production, you would enforce: if (!media.isPaid) { return 403 }
    // if (!media.isPaid) {
    //   return NextResponse.json({ error: 'Media is not paid for' }, { status: 403 })
    // }

    // Download from Supabase Storage
    // The database returns snake_case field names, so use file_path instead of filePath
    const filePath = media.file_path || media.filePath

    // Check if filePath exists
    if (!filePath) {
      return NextResponse.json(
        {
          error: 'File path not found in media record',
          mediaId: media.id,
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
      // Format: just filename, assume it's in generated-media bucket
      bucket = 'generated-media'
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
        'Content-Type': media.mime_type || media.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download media error:', error)
    return NextResponse.json(
      {
        error: 'Failed to download media',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
