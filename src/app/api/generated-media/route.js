import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { deleteFile } from '@/utils/storage-helper'

// GET all generated media
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // For demo version: show all active media to all users
    const whereClause = {
      isActive: true,
      // Demo mode: show all media regardless of user authentication
      ...(typeFilter ? { type: typeFilter } : {}),
    }

    console.log('[GENERATED-MEDIA] Demo mode: showing all media')

    const media = await prisma.generatedMedia.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
      include: {
        targetTemplate: { select: { type: true } },
        faceSource: { select: { id: true, filename: true } },
      },
    })

    // Convert BigInt values to strings
    const serializedMedia = media.map(item => ({
      ...item,
      fileSize: item.fileSize.toString(),
      mimeType: item.mimeType || 'video/mp4', // Provide default mimeType if not set
      // GeneratedMedia doesn't have thumbnailPath field, so always use placeholder
      thumbnailPath: '/placeholder-thumbnail.svg',
    }))

    return NextResponse.json({ files: serializedMedia })
  } catch (error) {
    console.error('Error fetching generated media:', error)
    return NextResponse.json({ error: 'Failed to fetch generated media' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Find the generated media record to get the file path
    const media = await prisma.generatedMedia.findFirst({
      where: { name: filename },
    })

    if (media && media.filePath) {
      try {
        // Delete from Supabase Storage
        const deleteResult = await deleteFile(media.filePath)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${media.filePath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.warn('Warning: Could not delete output file from storage:', error)
        // Continue with operation even if file deletion fails
      }
    }

    // Delete from generatedMedia table
    await prisma.generatedMedia.deleteMany({ where: { name: filename } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting generated media:', error)
    return NextResponse.json({ error: 'Failed to delete generated media' }, { status: 500 })
  }
}
