import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/services/auth'

// Create a direct Prisma client instance for this route
const prisma = new PrismaClient({
  log: ['error'],
})

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
    const video = await prisma.generatedMedia.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 2. Delete the file from the outputs folder
    if (video.filePath) {
      // Extract the filename from the path (/outputs/filename.mp4)
      const filename = path.basename(video.filePath)
      const filePath = path.join(process.cwd(), 'public', 'outputs', filename)

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`[DELETE] Successfully deleted file: ${filePath}`)
        } else {
          console.log(`[DELETE] File not found at path: ${filePath}`)
        }
      } catch (fileError) {
        console.error(`[DELETE ERROR] Error deleting file: ${fileError.message}`)
        // We'll continue with the database deletion even if the file deletion fails
      }
    }

    // 3. Delete the record from the database
    await prisma.generatedMedia.delete({
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
