import { NextResponse } from 'next/server'
import { deleteFile } from '@/utils/storage-helper'
import { getValidatedUserId } from '@/utils/auth-helper'
import { getFaceSourceById, updateFaceSource, deleteFaceSource } from '@/lib/supabase-db'

// GET a single face source by ID
export async function GET(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const faceSource = await getFaceSourceById(id)

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    return NextResponse.json(faceSource)
  } catch (error) {
    console.error('Error fetching face source:', error)
    return NextResponse.json({ error: 'Failed to fetch face source' }, { status: 500 })
  }
}

// PUT (update) a face source by ID
export async function PUT(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const data = await request.json()

    // Check if face source exists
    const existingSource = await getFaceSourceById(id)

    if (!existingSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Update face source
    const updatedSource = await updateFaceSource(id, {
      filename: data.filename,
      is_active: data.isActive,
      usage_count: data.usageCount,
      last_used_at: data.lastUsedAt ? new Date(data.lastUsedAt).toISOString() : undefined,
    })

    return NextResponse.json(updatedSource)
  } catch (error) {
    console.error('Error updating face source:', error)
    return NextResponse.json({ error: 'Failed to update face source' }, { status: 500 })
  }
}

// DELETE a face source by ID
export async function DELETE(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    console.log(`[DELETE] Attempting to delete face source with ID: ${id}`)

    // Get validated user ID for ownership check
    const validUserId = await getValidatedUserId()
    console.log(`[DELETE] User ID from validation: ${validUserId || 'Not authenticated'}`)

    if (!validUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find the face source with ownership check
    const faceSource = await getFaceSourceById(id)

    if (!faceSource || faceSource.author_id !== validUserId) {
      console.log(`[DELETE] Face source with ID ${id} not found or unauthorized`)
      return NextResponse.json(
        {
          error: 'Face source not found or you do not have permission to delete it',
        },
        { status: 404 }
      )
    }

    console.log(`[DELETE] Found face source to delete:`, JSON.stringify(faceSource))

    // Delete physical file from Supabase Storage first
    if (faceSource.file_path) {
      const deleteResult = await deleteFile(faceSource.file_path)
      console.log(
        `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${faceSource.file_path}`
      )
      if (!deleteResult.success) {
        console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
      }
    }

    // Soft delete from database (set is_active to false)
    await deleteFaceSource(id)
    console.log(`[DELETE] Successfully soft-deleted face source ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Face source deleted successfully',
      deleteType: 'soft',
    })
  } catch (error) {
    console.error('[DELETE] Error deleting face source:', error)
    return NextResponse.json({ error: 'Failed to delete face source' }, { status: 500 })
  }
}
