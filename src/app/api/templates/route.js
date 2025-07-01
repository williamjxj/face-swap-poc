import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { serializeBigInt } from '@/utils/helper'

// GET all templates
export async function GET() {
  try {
    // Check environment variables
    console.log('Environment check:', {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    })

    if (!db) {
      throw new Error('Database client is not initialized')
    }

    // Test database connection first
    await db.$queryRaw`SELECT 1`
    console.log('Database connection successful')

    console.log('Fetching all active templates...')
    const templates = await db.targetTemplate.findMany({
      where: {
        isActive: true,
        // Templates are shared resources - show all active templates to all users
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${templates.length} active templates`)
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
