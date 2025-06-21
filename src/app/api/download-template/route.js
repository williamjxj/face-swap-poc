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

    // Check if the template exists
    const template = await prisma.targetTemplate.findFirst({
      where: {
        OR: [{ name: filename }, { filename: filename }],
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Construct file path - templates are stored in public/templates
    const filePath = path.join(
      process.cwd(),
      'public',
      'templates',
      template.filename || template.name
    )

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': template.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${template.filename || template.name}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading template:', error)
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 })
  }
}
