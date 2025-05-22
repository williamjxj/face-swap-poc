import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { serializeBigInt } from '@/utils/helper'

// GET all templates
export async function GET() {
  try {
    if (!db) {
      throw new Error('Database client is not initialized')
    }

    console.log('Fetching templates...')
    const templates = await db.targetTemplate.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${templates.length} templates`)
    // Serialize BigInt fields before returning
    const serializedTemplates = serializeBigInt(templates)
    return NextResponse.json({ templates: serializedTemplates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch templates',
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
    const template = await db.targetTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        filePath: data.filePath,
        thumbnailPath: data.thumbnailPath,
        fileSize: data.fileSize,
        duration: data.duration,
        mimeType: data.mimeType,
        authorId: data.authorId,
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
