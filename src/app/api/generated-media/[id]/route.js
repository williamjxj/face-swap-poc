import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { deleteFile } from '@/utils/storage-helper'

// GET single generated media
export async function GET(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

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

    // Convert BigInt to string and add thumbnail fallback
    const responseData = {
      ...generatedMedia,
      fileSize: generatedMedia.fileSize.toString(),
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
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (data.downloadCount !== undefined) {
      updateData.downloadCount = (existingMedia.downloadCount || 0) + 1
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
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    console.log(`[DELETE] Attempting to delete generated media with ID: ${id}`)

    // Find the media to get file paths before deletion
    const generatedMedia = await prisma.generatedMedia.findUnique({
      where: { id },
      select: {
        id: true,
        filePath: true,
        tempPath: true,
      },
    })

    if (!generatedMedia) {
      console.log(`[DELETE] Generated media with ID ${id} not found`)
      return NextResponse.json({ error: 'Generated media not found' }, { status: 404 })
    }

    console.log(`[DELETE] Found generated media to delete:`, JSON.stringify(generatedMedia))

    // There are no dependencies on GeneratedMedia, so we can do a hard delete
    let deleteType = 'none'

    try {
      // Direct SQL delete for maximum control
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM "GeneratedMedia" 
        WHERE "id" = ${id}
      `

      console.log(`[DELETE] Raw SQL delete affected ${deleteResult} rows`)
      deleteType = deleteResult > 0 ? 'hard-sql' : 'failed'
    } catch (sqlError) {
      console.error(`[DELETE] SQL delete failed:`, sqlError)

      // Try the Prisma delete as fallback
      try {
        console.log(`[DELETE] Attempting Prisma delete as fallback`)
        await prisma.generatedMedia.delete({
          where: { id },
        })
        console.log(`[DELETE] Prisma delete succeeded`)
        deleteType = 'hard-prisma'
      } catch (prismaError) {
        console.error(`[DELETE] Prisma delete failed:`, prismaError)

        // Ultimate fallback to soft delete
        await prisma.generatedMedia.update({
          where: { id },
          data: { isActive: false },
        })
        console.log(`[DELETE] Fallback: marked generated media ${id} as inactive`)
        deleteType = 'soft-fallback'
      }
    }

    // Delete the physical files from Supabase Storage
    if (generatedMedia.filePath) {
      try {
        const deleteResult = await deleteFile(generatedMedia.filePath)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${generatedMedia.filePath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.error(`[DELETE] Error deleting file from storage:`, error)
      }
    }

    // Delete the temporary file if it exists
    if (generatedMedia.tempPath) {
      try {
        const deleteResult = await deleteFile(generatedMedia.tempPath)
        console.log(
          `[DELETE] Temp file deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${generatedMedia.tempPath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Temp storage deletion error: ${deleteResult.error}`)
        }
      } catch (error) {
        console.error(`[DELETE] Error deleting temp file from storage:`, error)
      }
    }

    // Wait a brief moment to ensure database operations are complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify if the record is actually gone after deletion attempt
    if (deleteType.startsWith('hard')) {
      try {
        // Use raw SQL to verify deletion to bypass any caching
        const checkExists = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM "GeneratedMedia" 
          WHERE "id" = ${id}
        `

        const stillExists = Number(checkExists[0]?.count || 0) > 0

        if (stillExists) {
          console.log(`[DELETE] WARNING: Record still exists after deletion attempt!`)
          deleteType += '-failed'

          // Final attempt with most direct method
          try {
            await prisma.$executeRawUnsafe(`DELETE FROM "GeneratedMedia" WHERE id = '${id}'`)
            console.log(`[DELETE] Final forced deletion attempt executed`)

            // Verify again
            const finalCheck = await prisma.$queryRaw`
              SELECT COUNT(*) as count 
              FROM "GeneratedMedia" 
              WHERE "id" = ${id}
            `

            if (Number(finalCheck[0]?.count || 0) === 0) {
              console.log(`[DELETE] Final deletion attempt succeeded`)
              deleteType = 'hard-forced'
            }
          } catch (finalError) {
            console.error(`[DELETE] Final deletion attempt failed:`, finalError)
          }
        } else {
          console.log(`[DELETE] Confirmed: Record no longer exists in database`)
          deleteType += '-confirmed'
        }
      } catch (checkError) {
        console.error(`[DELETE] Error checking if record still exists:`, checkError)
      }
    }

    return NextResponse.json({
      success: true,
      id,
      deleteType,
      message:
        deleteType.startsWith('hard') && !deleteType.includes('failed')
          ? 'Generated media permanently deleted'
          : 'Generated media marked as inactive',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[DELETE] Error deleting generated media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
