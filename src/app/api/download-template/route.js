import { NextResponse } from 'next/server'
import { getStorageUrl } from '@/utils/storage-helper'
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

    // Get Supabase Storage public URL
    const publicUrl = await getStorageUrl(template.filePath)

    if (!publicUrl) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    // Redirect to Supabase Storage public URL
    return NextResponse.redirect(publicUrl)
  } catch (error) {
    console.error('Error downloading template:', error)
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 })
  }
}
