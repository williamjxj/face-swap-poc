import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'
import { deleteFile } from '@/utils/storage-helper'

export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    // Log session for debugging
    console.log('[DELETE] Session check:', {
      hasSession: !!session,
      user: session?.user?.email,
    })

    // Skip auth check in development for easier testing
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request to get the video ID
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log(`[DELETE] Attempting to delete video with ID: ${id}`)

    // 1. Find the video in the database
    const video = await db.generatedMedia.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 2. Delete the file from Supabase Storage
    if (video.filePath) {
      try {
        const deleteResult = await deleteFile(video.filePath)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${video.filePath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
        }
      } catch (fileError) {
        console.error(`[DELETE ERROR] Error deleting file from storage: ${fileError.message}`)
        // We'll continue with the database deletion even if the file deletion fails
      }
    }

    // 3. Delete the record from the database
    await db.generatedMedia.delete({
      where: { id },
    })

    console.log(`[DELETE] Successfully deleted video record with ID: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE ERROR] Failed to delete video:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete video',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
