import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET single generated media
export async function GET(request, { params }) {
  try {
    const { id } = params
    const generatedMedia = await prisma.generatedMedia.findUnique({
      where: { id },
      include: {
        author: true,
        targetTemplate: true,
        faceSource: true,
      },
    })

    if (!generatedMedia) {
      return NextResponse.json({ error: 'Generated media not found' }, { status: 404 })
    }

    // Ensure thumbnailPath has a fallback value
    const responseData = {
      ...generatedMedia,
      fileSize: generatedMedia.fileSize.toString(),
      thumbnailPath: generatedMedia.thumbnailPath || '/placeholder-thumbnail.svg',
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT (update) generated media
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    // Get the existing media item first
    const existingMedia = await prisma.generatedMedia.findUnique({
      where: { id },
    })

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Only update fields that were provided in the request
    const updateData = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.tempPath !== undefined) updateData.tempPath = data.tempPath
    if (data.filePath !== undefined) updateData.filePath = data.filePath
    if (data.thumbnailPath !== undefined) updateData.thumbnailPath = data.thumbnailPath
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Special handling for counters - increment instead of replace if they're set
    if (data.playCount !== undefined) {
      updateData.playCount = existingMedia.playCount + 1
    }

    if (data.downloadCount !== undefined) {
      updateData.downloadCount = existingMedia.downloadCount + 1
    }

    const updatedGeneratedMedia = await prisma.generatedMedia.update({
      where: { id },
      data: updateData,
    })

    // Convert BigInt to string for response
    const serializedMedia = {
      ...updatedGeneratedMedia,
      fileSize: updatedGeneratedMedia.fileSize.toString(),
    }

    return NextResponse.json(serializedMedia)
  } catch (error) {
    console.error('Error updating generated media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE generated media
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Soft delete by setting isActive to false
    const deletedGeneratedMedia = await prisma.generatedMedia.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(deletedGeneratedMedia)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
