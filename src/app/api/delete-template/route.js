import { NextResponse } from 'next/server'
import { unlink, access } from 'fs/promises'
import path from 'path'
import db from '@/lib/db'

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

    // Delete files
    const publicDir = path.join(process.cwd(), 'public')

    // Delete video file
    if (template.filePath) {
      const videoPath = path.join(publicDir, template.filePath.slice(1))
      try {
        // Check if file exists first
        await access(videoPath)
        await unlink(videoPath)
      } catch (error) {
        // File doesn't exist or can't be deleted, continue with DB operation
        console.warn('Warning: Could not delete video file:', error)
      }
    }

    // Delete thumbnail file
    if (template.thumbnailPath) {
      const thumbnailPath = path.join(publicDir, template.thumbnailPath.slice(1))
      try {
        // Check if file exists first
        await access(thumbnailPath)
        await unlink(thumbnailPath)
      } catch (error) {
        // File doesn't exist or can't be deleted, continue with DB operation
        console.warn('Warning: Could not delete thumbnail file:', error)
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
