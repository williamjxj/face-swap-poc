import { NextResponse } from 'next/server'
import { getValidatedUserId } from '@/utils/auth-helper'
import { deleteFile } from '@/utils/storage-helper'
import { getTargetTemplateById, updateTargetTemplate } from '@/lib/supabase-db'
import { supabase } from '@/lib/supabase'

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

    const template = await getTargetTemplateById(id)

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
    const template = await getTargetTemplateById(id)

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
    const { count: referenceCount } = await supabase
      .from('generated_media')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', id)
    console.log(`[DELETE] SQL check found ${referenceCount} references to template ${id}`)

    let deleteType = 'none'

    if (referenceCount > 0) {
      console.log(
        `[DELETE] Template ${id} has ${referenceCount} associated media records. Performing soft delete.`
      )
      // If media exists, just do a soft delete
      await updateTargetTemplate(id, { is_active: false })
      console.log(`[DELETE] Successfully marked template ${id} as inactive`)
      deleteType = 'soft'
    } else {
      // If no associated media, perform a hard delete with careful handling
      try {
        // First ensure there are no references by nullifying them
        await supabase.from('generated_media').update({ template_id: null }).eq('template_id', id)

        console.log(`[DELETE] Nullified any potential references to template ${id}`)

        // Now perform the actual delete
        const { data: deleteResult, error: deleteError } = await supabase
          .from('target_templates')
          .delete()
          .eq('id', id)
          .select()

        if (deleteError) {
          throw deleteError
        }

        console.log(`[DELETE] Supabase delete successful`)
        deleteType = deleteResult && deleteResult.length > 0 ? 'hard-supabase' : 'failed'
      } catch (deleteError) {
        console.error(`[DELETE] Supabase delete failed:`, deleteError)

        // Ultimate fallback to soft delete
        await updateTargetTemplate(id, { is_active: false })
        console.log(`[DELETE] Fallback: marked template ${id} as inactive`)
        deleteType = 'soft-fallback'
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
        // Check if record still exists using Supabase
        const { data: checkExists, error: checkError } = await supabase
          .from('target_templates')
          .select('id')
          .eq('id', id)
          .single()

        const stillExists = checkExists && !checkError

        if (stillExists) {
          console.log(`[DELETE] WARNING: Record still exists after deletion attempt!`)
          deleteType += '-failed'

          // Final attempt with direct Supabase deletion
          try {
            const { error: forceError } = await supabase
              .from('target_templates')
              .delete()
              .eq('id', id)

            if (forceError) {
              console.error(`[DELETE] Force deletion failed:`, forceError)
            } else {
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
    const template = await getTargetTemplateById(id)

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
    const updatedTemplate = await updateTargetTemplate(id, {
      ...data,
      // Prevent changing these security-sensitive fields via PATCH
      authorId: undefined,
      isActive: undefined,
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
