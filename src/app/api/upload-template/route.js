import { NextResponse } from 'next/server'
import { logSessionDebugInfo } from '@/utils/auth-helper'
import { uploadFile, deleteFile, STORAGE_BUCKETS } from '@/utils/storage-helper'
import {
  createTargetTemplate,
  getTargetTemplates,
  getTargetTemplateById,
  deleteTargetTemplate,
} from '@/lib/supabase-db'

// Constants
const VALID_FILE_TYPES = [
  'video/mp4',
  'video/wav',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
]

const MAX_FILE_SIZE = 150 * 1024 * 1024 // 150MB

// Helper functions
const sanitizeFilename = filename => {
  const lastDotIndex = filename.lastIndexOf('.')
  const extension = filename.substring(lastDotIndex)
  const baseName = filename.substring(0, lastDotIndex)

  const sanitizedBaseName =
    baseName
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') || 'template' // Remove leading/trailing underscores

  return `${sanitizedBaseName}_${Date.now()}${extension}`
}

const getTemplateType = (fileType, formDataType) => {
  if (formDataType) return formDataType

  if (fileType.startsWith('video/')) return 'video'
  if (fileType === 'image/gif') return 'gif'
  return 'image'
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!VALID_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${VALID_FILE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const originalName = file.name
    const filename = sanitizeFilename(originalName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload to template-videos bucket
    const bucket = STORAGE_BUCKETS.TEMPLATE_VIDEOS
    const filePath = `${bucket}/${filename}`

    const uploadResult = await uploadFile(fileBuffer, filePath, {
      contentType: file.type,
      cacheControl: '3600',
      overwrite: true,
    })

    if (!uploadResult.success) {
      return NextResponse.json({ error: `Upload failed: ${uploadResult.error}` }, { status: 500 })
    }

    // Determine template type and video properties
    const templateType = getTemplateType(file.type, formData.get('templateType'))

    // For videos, thumbnail generation would happen here in production
    const thumbnailPath = null
    const duration = null

    // Get user session info
    await logSessionDebugInfo()

    // Create template data
    const templateData = {
      name: originalName,
      description: templateType,
      video_url: filePath,
      thumbnail_url: thumbnailPath,
      file_path: filePath,
      file_size: file.size,
      duration: duration,
      is_active: true,
    }

    const template = await createTargetTemplate(templateData)

    return NextResponse.json({
      id: template.id,
      filename: template.name,
      filePath: template.file_path,
      thumbnailPath: template.thumbnail_url,
      duration: template.duration,
      fileSize: template.file_size ? template.file_size.toString() : '0',
      mimeType: file.type,
    })
  } catch (error) {
    const errorMessage = error.message || 'Failed to upload template'
    return NextResponse.json(
      {
        error: errorMessage,
        details: error.code || '',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const templates = await getTargetTemplates()
    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const template = await getTargetTemplateById(id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete files from storage
    const filesToDelete = [template.filePath, template.thumbnailPath].filter(Boolean)

    await Promise.allSettled(filesToDelete.map(filePath => deleteFile(filePath)))

    // Delete database record
    await deleteTargetTemplate(id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
