import { NextResponse } from 'next/server'
import { supabase } from '@/utils/storage-helper'
import { getTargetTemplateByName } from '@/lib/supabase-db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Check if the template exists
    const template = await getTargetTemplateByName(filename)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get the file path from the template
    const filePath = template.file_path || template.filePath

    if (!filePath) {
      return NextResponse.json(
        {
          error: 'File path not found in template record',
          templateId: template.id,
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
      // Format: just filename, assume it's in template-videos bucket
      bucket = 'template-videos'
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
        'Content-Type': template.mime_type || template.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading template:', error)
    return NextResponse.json(
      {
        error: 'Failed to download template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
