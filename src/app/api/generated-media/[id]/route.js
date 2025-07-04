import { NextResponse } from 'next/server'
import { deleteFile } from '@/utils/storage-helper'
import {
  getGeneratedMediaById,
  updateGeneratedMedia,
  deleteGeneratedMediaById,
} from '@/lib/supabase-db'

// GET single generated media
export async function GET(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const generatedMedia = await getGeneratedMediaById(id)

    if (!generatedMedia) {
      return NextResponse.json({ error: 'Generated media not found' }, { status: 404 })
    }

    // Convert BigInt to string and add thumbnail fallback
    const responseData = {
      ...generatedMedia,
      fileSize: generatedMedia.file_size?.toString() || '0',
      thumbnailPath: '/placeholder-thumbnail.svg', // Default thumbnail since field doesn't exist in schema
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT (update) generated media
export async function PUT(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const data = await request.json()

    // Get the existing media item first
    const existingMedia = await getGeneratedMediaById(id)

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Only update fields that were provided in the request
    const updateData = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.tempPath !== undefined) updateData.tempPath = data.tempPath
    if (data.filePath !== undefined) updateData.filePath = data.filePath
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.duration !== undefined) updateData.duration = data.duration

    if (data.downloadCount !== undefined) {
      updateData.downloadCount = (existingMedia.downloadCount || 0) + 1
    }

    const updatedGeneratedMedia = await updateGeneratedMedia(id, updateData)

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

// PATCH (partial update) generated media
export async function PATCH(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const data = await request.json()

    // Get the existing media item first
    const existingMedia = await getGeneratedMediaById(id)

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Only update fields that were provided in the request
    const updateData = {}

    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.isPaid !== undefined) updateData.is_paid = data.isPaid
    if (data.downloadCount !== undefined) {
      updateData.download_count = (existingMedia.download_count || 0) + 1
    }

    const updatedGeneratedMedia = await updateGeneratedMedia(id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedGeneratedMedia,
      message: 'Media updated successfully',
    })
  } catch (error) {
    console.error('Error updating generated media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE generated media
export async function DELETE(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    console.log(`[DELETE] Attempting to delete generated media with ID: ${id}`)

    // Find the media to get file paths before deletion
    const generatedMedia = await getGeneratedMediaById(id)

    if (!generatedMedia) {
      console.log(`[DELETE] Generated media with ID ${id} not found`)
      return NextResponse.json({ error: 'Generated media not found' }, { status: 404 })
    }

    console.log(`[DELETE] Found generated media to delete:`, generatedMedia.output_filename)

    // Delete the physical files from Supabase Storage
    if (generatedMedia.file_path) {
      try {
        const deleteResult = await deleteFile(generatedMedia.file_path)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${generatedMedia.file_path}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.error(`[DELETE] Error deleting file from storage:`, error)
      }
    }

    // Delete from database using Supabase (hard delete as per user preference)
    try {
      await deleteGeneratedMediaById(id)
      console.log(`[DELETE] Successfully deleted generated media from database: ${id}`)
    } catch (dbError) {
      console.error(`[DELETE] Database deletion failed:`, dbError)
      return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id,
      message: 'Generated media permanently deleted',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[DELETE] Error deleting generated media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
