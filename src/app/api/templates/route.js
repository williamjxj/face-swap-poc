import { NextResponse } from 'next/server'
import { getTargetTemplates, createTargetTemplate } from '@/lib/supabase-db'
import { serializeBigInt } from '@/utils/helper'

// GET all templates
export async function GET() {
  try {
    const templates = await getTargetTemplates(false) // false = exclude guidelines

    // Serialize BigInt fields before returning
    const serializedTemplates = serializeBigInt(templates)
    return NextResponse.json({ templates: serializedTemplates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch templates',
        details: {
          code: error.code,
          meta: error.meta,
        },
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// POST new template
export async function POST(request) {
  try {
    const data = await request.json()
    const template = await createTargetTemplate({
      filename: data.name,
      type: data.type,
      file_path: data.filePath,
      thumbnail_path: data.thumbnailPath,
      file_size: data.fileSize,
      duration: data.duration,
      mime_type: data.mimeType,
      author_id: data.authorId,
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
