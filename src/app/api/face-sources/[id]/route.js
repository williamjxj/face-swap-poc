import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// GET a single face source by ID
export async function GET(request, { params }) {
  try {
    const { id } = params

    const faceSource = await prisma.faceSource.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    return NextResponse.json(faceSource)
  } catch (error) {
    console.error('Error fetching face source:', error)
    return NextResponse.json({ error: 'Failed to fetch face source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT (update) a face source by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    // Check if face source exists
    const existingSource = await prisma.faceSource.findUnique({
      where: { id },
    })

    if (!existingSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Update face source
    const updatedSource = await prisma.faceSource.update({
      where: { id },
      data: {
        filename: data.filename,
        isActive: data.isActive,
        usageCount: data.usageCount,
        lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
      },
    })

    return NextResponse.json(updatedSource)
  } catch (error) {
    console.error('Error updating face source:', error)
    return NextResponse.json({ error: 'Failed to update face source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE a face source by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Find the face source
    const faceSource = await prisma.faceSource.findUnique({
      where: { id },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Soft delete in database
    await prisma.faceSource.update({
      where: { id },
      data: { isActive: false },
    })

    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', faceSource.filePath)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn('Warning: Could not delete physical file:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting face source:', error)
    return NextResponse.json({ error: 'Failed to delete face source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
