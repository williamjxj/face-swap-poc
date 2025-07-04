import { NextResponse } from 'next/server'
import { deleteFile } from '@/utils/storage-helper'
import { getGeneratedMediaByName, deleteGeneratedMediaById } from '@/lib/supabase-db'

export async function DELETE(request) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Find the generated media record
    const media = await getGeneratedMediaByName(filename)

    if (media && media.file_path) {
      try {
        // Delete from Supabase Storage
        await deleteFile(media.file_path)
      } catch (error) {
        console.warn('Warning: Could not delete output file from storage:', error)
        // Continue with operation even if file deletion fails
      }

      // Delete the database record
      await deleteGeneratedMediaById(media.id)
    } else {
      console.warn(`Warning: Media record not found for filename: ${filename}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting output file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
