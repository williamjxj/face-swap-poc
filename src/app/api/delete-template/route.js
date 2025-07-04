import { NextResponse } from 'next/server'
import { deleteFile } from '@/utils/storage-helper'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get template details before deletion
    const template = await db.targetTemplate.findUnique({
      where: { id: id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete files from Supabase Storage
    // Delete video file
    if (template.filePath) {
      try {
        const deleteResult = await deleteFile(template.filePath)
        console.log(
          `[DELETE] Video file deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${template.filePath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Video storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.warn('Warning: Could not delete video file from storage:', error)
      }
    }

    // Delete thumbnail file
    if (template.thumbnailPath) {
      try {
        const deleteResult = await deleteFile(template.thumbnailPath)
        console.log(
          `[DELETE] Thumbnail file deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${template.thumbnailPath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Thumbnail storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.warn('Warning: Could not delete thumbnail file from storage:', error)
      }
    }

    // Delete database record
    await db.targetTemplate.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
