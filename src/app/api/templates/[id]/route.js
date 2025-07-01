import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getValidatedUserId } from '@/utils/auth-helper'
import { deleteFile } from '@/utils/storage-helper'

/**
 * GET template by ID
 */
export async function GET(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const template = await db.targetTemplate.findUnique({
      where: {
        id,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Convert BigInt to string for JSON serialization
    const serializedTemplate = {
      ...template,
      fileSize: template.fileSize.toString(),
    }

    return NextResponse.json(serializedTemplate)
  } catch (error) {
    console.error(`Error fetching template ${resolvedParams.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE template by ID
 */
export async function DELETE(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      console.log('[DELETE] Template ID is missing from params')
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    console.log(`[DELETE] Attempting to delete template with ID: ${id}`)

    // Get the validated user ID
    const userId = await getValidatedUserId()
    console.log(`[DELETE] User ID from validation: ${userId || 'Not authenticated'}`)

    // Find the template to make sure it exists and belongs to the user (if applicable)
    const template = await db.targetTemplate.findUnique({
      where: {
        id,
        isActive: true,
      },
    })

    if (!template) {
      console.log(`[DELETE] Template with ID ${id} not found or already inactive`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    console.log(
      `[DELETE] Found template: ${JSON.stringify({
        id: template.id,
        filename: template.filename,
        authorId: template.authorId,
        filePath: template.filePath,
        thumbnailPath: template.thumbnailPath,
      })}`
    )

    // If template has an author, verify ownership
    if (template.authorId && userId && template.authorId !== userId) {
      console.log(
        `[DELETE] Unauthorized deletion attempt. Template belongs to ${template.authorId}, request from ${userId}`
      )
      return NextResponse.json({ error: 'Unauthorized to delete this template' }, { status: 403 })
    }

    // First, check if there are any associated generatedMedia records
    const references = await db.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "GeneratedMedia" 
      WHERE "template_id" = ${id}
    `

    const referenceCount = Number(references[0]?.count || 0)
    console.log(`[DELETE] SQL check found ${referenceCount} references to template ${id}`)

    let deleteType = 'none'

    if (referenceCount > 0) {
      console.log(
        `[DELETE] Template ${id} has ${referenceCount} associated media records. Performing soft delete.`
      )
      // If media exists, just do a soft delete
      await db.targetTemplate.update({
        where: { id },
        data: { isActive: false },
      })
      console.log(`[DELETE] Successfully marked template ${id} as inactive`)
      deleteType = 'soft'
    } else {
      // If no associated media, perform a hard delete with careful handling
      try {
        // First ensure there are no references by nullifying them
        await db.$executeRaw`
          UPDATE "GeneratedMedia" 
          SET "template_id" = NULL 
          WHERE "template_id" = ${id}
        `

        console.log(`[DELETE] Nullified any potential references to template ${id}`)

        // Now perform the actual delete with raw SQL for maximum control
        const deleteResult = await db.$executeRaw`
          DELETE FROM "TargetTemplate" 
          WHERE "id" = ${id}
        `

        console.log(`[DELETE] Raw SQL delete affected ${deleteResult} rows`)
        deleteType = deleteResult > 0 ? 'hard-sql' : 'failed'
      } catch (sqlError) {
        console.error(`[DELETE] SQL delete failed:`, sqlError)

        // Try the Prisma delete as fallback
        try {
          console.log(`[DELETE] Attempting Prisma delete as fallback`)
          await db.targetTemplate.delete({
            where: { id },
          })
          console.log(`[DELETE] Prisma delete succeeded`)
          deleteType = 'hard-prisma'
        } catch (prismaError) {
          console.error(`[DELETE] Prisma delete failed:`, prismaError)

          // Ultimate fallback to soft delete
          await db.targetTemplate.update({
            where: { id },
            data: { isActive: false },
          })
          console.log(`[DELETE] Fallback: marked template ${id} as inactive`)
          deleteType = 'soft-fallback'
        }
      }
    }

    // Delete files from Supabase Storage
    if (template.filePath) {
      try {
        const deleteResult = await deleteFile(template.filePath)
        console.log(
          `[DELETE] File deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${template.filePath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] File deletion error:`, deleteResult.error)
        }
      } catch (error) {
        console.error(`[DELETE] Error deleting file from storage:`, error)
      }
    }

    // Also delete thumbnail if it exists
    if (template.thumbnailPath) {
      try {
        const deleteResult = await deleteFile(template.thumbnailPath)
        console.log(
          `[DELETE] Thumbnail deletion ${deleteResult.success ? 'succeeded' : 'failed'} for: ${template.thumbnailPath}`
        )
        if (!deleteResult.success) {
          console.error(`[DELETE] Thumbnail deletion error:`, deleteResult.error)
        }
      } catch (error) {
        console.error(`[DELETE] Error deleting thumbnail from storage:`, error)
      }
    }

    // Wait a brief moment to ensure database operations are complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify if the record is actually gone after deletion attempt
    if (deleteType.startsWith('hard')) {
      try {
        // Use raw SQL to verify deletion to bypass any caching
        const checkExists = await db.$queryRaw`
          SELECT COUNT(*) as count 
          FROM "TargetTemplate" 
          WHERE "id" = ${id}
        `

        const stillExists = Number(checkExists[0]?.count || 0) > 0

        if (stillExists) {
          console.log(`[DELETE] WARNING: Record still exists after deletion attempt!`)
          deleteType += '-failed'

          // Final attempt with most direct method
          try {
            await db.$executeRawUnsafe(`DELETE FROM "TargetTemplate" WHERE id = '${id}'`)
            console.log(`[DELETE] Final forced deletion attempt executed`)

            // Verify again
            const finalCheck = await db.$queryRaw`
              SELECT COUNT(*) as count 
              FROM "TargetTemplate" 
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
          ? 'Template permanently deleted from database'
          : 'Template marked as inactive',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[DELETE] Error deleting template ${resolvedParams.id}:`, error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH template by ID for updating properties
 */
export async function PATCH(request, { params }) {
  try {
    // Await params to handle as a promise
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get the validated user ID
    const userId = await getValidatedUserId()

    // Find the template to make sure it exists
    const template = await db.targetTemplate.findUnique({
      where: {
        id,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // If template has an author, verify ownership
    if (template.authorId && userId && template.authorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to update this template' }, { status: 403 })
    }

    // Get update data from request
    const data = await request.json()

    // Update the template
    const updatedTemplate = await db.targetTemplate.update({
      where: { id },
      data: {
        ...data,
        // Prevent changing these security-sensitive fields via PATCH
        authorId: undefined,
        isActive: undefined,
      },
    })

    // Convert BigInt to string for JSON serialization
    const serializedTemplate = {
      ...updatedTemplate,
      fileSize: updatedTemplate.fileSize.toString(),
    }

    return NextResponse.json(serializedTemplate)
  } catch (error) {
    console.error(`Error updating template ${resolvedParams.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
