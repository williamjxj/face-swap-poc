import { NextResponse } from 'next/server'
import { getGeneratedMediaByUser, deleteGeneratedMedia } from '@/lib/supabase-db'
import { deleteFile } from '@/utils/storage-helper'
import { getValidatedUserId } from '@/utils/auth-helper'

// GET all generated media
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // For demo/POC: Show all generated media regardless of user to maximize content visibility
    console.log('[GENERATED-MEDIA] Showing all media (demo mode - all users)')

    let media = await getGeneratedMediaByUser(null) // null = get all media

    // Apply filters
    if (typeFilter) {
      media = media.filter(item => item.type === typeFilter)
    }

    if (limit) {
      media = media.slice(0, limit)
    }

    // Convert BigInt values to strings and format response
    const serializedMedia = media.map(item => ({
      ...item,
      file_size: item.file_size.toString(),
      mime_type: item.mime_type || 'video/mp4', // Provide default mimeType if not set
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

    const authorId = await getValidatedUserId()

    if (!authorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find the generated media record to get the file path
    const mediaList = await getGeneratedMediaByUser(authorId)
    const media = mediaList.find(item => item.name === filename)

    if (media && media.file_path) {
      try {
        // Delete from Supabase Storage
        const deleteResult = await deleteFile(media.file_path)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${media.file_path}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.warn('Warning: Could not delete output file from storage:', error)
        // Continue with operation even if file deletion fails
      }
    }

    if (media) {
      // Soft delete from generatedMedia table
      await deleteGeneratedMedia(media.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting generated media:', error)
    return NextResponse.json({ error: 'Failed to delete generated media' }, { status: 500 })
  }
}
