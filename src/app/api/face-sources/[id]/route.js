import { NextResponse } from 'next/server'
import { deletePublicFile } from '@/utils/file-helper'
import { getValidatedUserId } from '@/utils/auth-helper'
import { db as prisma } from '@/lib/db'

// GET a single face source by ID
export async function GET(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    const faceSource = await prisma.faceSource.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!faceSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    return NextResponse.json(faceSource)
  } catch (error) {
    console.error('Error fetching face source:', error)
    return NextResponse.json({ error: 'Failed to fetch face source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
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
    const existingSource = await prisma.faceSource.findUnique({
      where: { id },
    })

    if (!existingSource) {
      return NextResponse.json({ error: 'Face source not found' }, { status: 404 })
    }

    // Update face source
    const updatedSource = await prisma.faceSource.update({
      where: { id },
      data: {
        filename: data.filename,
        isActive: data.isActive,
        usageCount: data.usageCount,
        lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
      },
    })

    return NextResponse.json(updatedSource)
  } catch (error) {
    console.error('Error updating face source:', error)
    return NextResponse.json({ error: 'Failed to update face source' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
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

    // Find the face source with ownership check if user is authenticated
    const faceSource = await prisma.faceSource.findUnique({
      where: {
        id,
        ...(validUserId ? { authorId: validUserId } : {}),
      },
      select: {
        id: true,
        filePath: true,
        authorId: true,
      },
    })

    if (!faceSource) {
      console.log(`[DELETE] Face source with ID ${id} not found or unauthorized`)
      return NextResponse.json(
        {
          error: 'Face source not found or you do not have permission to delete it',
        },
        { status: 404 }
      )
    }

    console.log(`[DELETE] Found face source to delete:`, JSON.stringify(faceSource))

    // First, check for any hard dependencies
    const references = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as count, 
        'GeneratedMedia' as table_name 
      FROM "GeneratedMedia" 
      WHERE "face_source_id" = ${id}
    `

    const referenceCount = Number(references[0]?.count || 0)
    console.log(`[DELETE] SQL check found ${referenceCount} references to face source ${id}`)

    let deleteType = 'none'

    if (referenceCount > 0) {
      // If references exist, do a soft delete
      await prisma.faceSource.update({
        where: { id },
        data: { isActive: false },
      })
      console.log(
        `[DELETE] Soft delete: marked face source ${id} as inactive due to ${referenceCount} references`
      )
      deleteType = 'soft'
    } else {
      // If no references, perform a hard delete with careful handling
      try {
        // First ensure there are no references by nullifying them
        await prisma.$executeRaw`
          UPDATE "GeneratedMedia" 
          SET "face_source_id" = NULL 
          WHERE "face_source_id" = ${id}
        `

        console.log(`[DELETE] Nullified any potential references to face source ${id}`)

        // Now perform the actual delete with raw SQL for maximum control
        const deleteResult = await prisma.$executeRaw`
          DELETE FROM "FaceSource" 
          WHERE "id" = ${id}
        `

        console.log(`[DELETE] Raw SQL delete affected ${deleteResult} rows`)
        deleteType = deleteResult > 0 ? 'hard-sql' : 'failed'
      } catch (sqlError) {
        console.error(`[DELETE] SQL delete failed:`, sqlError)

        // Try the Prisma delete as fallback
        try {
          console.log(`[DELETE] Attempting Prisma delete as fallback`)
          await prisma.faceSource.delete({
            where: { id },
          })
          console.log(`[DELETE] Prisma delete succeeded`)
          deleteType = 'hard-prisma'
        } catch (prismaError) {
          console.error(`[DELETE] Prisma delete failed:`, prismaError)

          // Ultimate fallback to soft delete
          await prisma.faceSource.update({
            where: { id },
            data: { isActive: false },
          })
          console.log(`[DELETE] Fallback: marked face source ${id} as inactive`)
          deleteType = 'soft-fallback'
        }
      }
    }

    // Delete physical file
    if (faceSource.filePath) {
      const fileDeleted = await deletePublicFile(faceSource.filePath)
      console.log(
        `[DELETE] File deletion ${fileDeleted ? 'succeeded' : 'failed'} for: ${faceSource.filePath}`
      )
    }

    // Wait a brief moment to ensure database operations are complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify if the record is actually gone after deletion attempt
    if (deleteType.startsWith('hard')) {
      try {
        // Use raw SQL to verify deletion to bypass any caching
        const checkExists = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM "FaceSource" 
          WHERE "id" = ${id}
        `

        const stillExists = Number(checkExists[0]?.count || 0) > 0

        if (stillExists) {
          console.log(`[DELETE] WARNING: Record still exists after deletion attempt!`)
          deleteType += '-failed'

          // Final attempt with most direct method
          try {
            await prisma.$executeRawUnsafe(`DELETE FROM "FaceSource" WHERE id = '${id}'`)
            console.log(`[DELETE] Final forced deletion attempt executed`)

            // Verify again
            const finalCheck = await prisma.$queryRaw`
              SELECT COUNT(*) as count 
              FROM "FaceSource" 
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
          ? 'Face source permanently deleted from database'
          : 'Face source marked as inactive',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error deleting face source:', error)
    return NextResponse.json(
      {
        error: `Failed to delete face source: ${error.message}`,
      },
      { status: 500 }
    )
  }
}
