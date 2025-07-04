import { supabase } from './supabase'

// User operations
export const createUser = async userData => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        password_hash: userData.password_hash,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const findUserByEmail = async email => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}

export const findUserById = async id => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const updateUser = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUserLastLogin = async email => {
  const { data, error } = await supabase
    .from('users')
    .update({
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUserLastLogout = async email => {
  const { data, error } = await supabase
    .from('users')
    .update({
      last_logout: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserByEmail = async email => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}

export const upsertUser = async userData => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// Face Source operations
export const createFaceSource = async faceSourceData => {
  const { data, error } = await supabase
    .from('face_sources')
    .insert([
      {
        ...faceSourceData,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getFaceSourcesByUser = async userId => {
  let query = supabase
    .from('face_sources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // If userId is provided, filter by user, otherwise get all (for demo purposes)
  if (userId) {
    query = query.eq('author_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  // Convert snake_case to camelCase for UI compatibility
  return data.map(source => {
    // Determine type from mimeType if not set
    let type = source.type
    if (!type && source.mime_type) {
      if (source.mime_type.startsWith('image/')) {
        type = source.mime_type === 'image/gif' ? 'gif' : 'image'
      } else if (source.mime_type.startsWith('video/')) {
        type = 'video'
      }
    }

    return {
      ...source,
      filePath: source.file_path,
      filename: source.original_filename,
      authorId: source.author_id,
      originalFilename: source.original_filename,
      fileSize: source.file_size,
      mimeType: source.mime_type,
      isActive: source.is_active,
      lastUsedAt: source.last_used_at,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
      type: type,
    }
  })
}

export const getFaceSourceById = async id => {
  const { data, error } = await supabase.from('face_sources').select('*').eq('id', id).single()

  if (error) throw error

  if (!data) return null

  // Apply same transformation as getFaceSourcesByUser for consistency
  const source = data

  // Determine type from mimeType if not set
  let type = source.type
  if (!type && source.mime_type) {
    if (source.mime_type.startsWith('image/')) {
      type = source.mime_type === 'image/gif' ? 'gif' : 'image'
    } else if (source.mime_type.startsWith('video/')) {
      type = 'video'
    }
  }

  return {
    ...source,
    filePath: source.file_path,
    filename: source.original_filename,
    authorId: source.author_id,
    originalFilename: source.original_filename,
    fileSize: source.file_size,
    mimeType: source.mime_type,
    isActive: source.is_active,
    lastUsedAt: source.last_used_at,
    createdAt: source.created_at,
    updatedAt: source.updated_at,
    type: type,
  }
}

export const getFaceSourceByFilename = async filename => {
  const { data, error } = await supabase
    .from('face_sources')
    .select('*')
    .eq('original_filename', filename)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data
}

export const updateFaceSource = async (id, updates) => {
  const { data, error } = await supabase
    .from('face_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteFaceSource = async id => {
  const { data, error } = await supabase
    .from('face_sources')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Target Template operations
export const getTargetTemplates = async (includeGuidelines = true) => {
  const { data, error } = await supabase
    .from('target_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  let filteredData = data

  // Filter out guidelines if not requested (for templates API)
  if (!includeGuidelines) {
    filteredData = data.filter(
      template => !template.file_path || !template.file_path.startsWith('guideline-images/')
    )
  }

  // Convert snake_case to camelCase for UI compatibility
  return filteredData.map(template => {
    // Determine type and mimeType from file extension if not set
    let type = template.type
    let mimeType = template.mime_type

    if (!type || !mimeType) {
      const fileName = template.name || template.file_path || ''
      const extension = fileName.toLowerCase().split('.').pop()

      switch (extension) {
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'webm':
          type = 'video'
          mimeType = `video/${extension === 'mov' ? 'quicktime' : extension}`
          break
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'webp':
          type = 'image'
          mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
          break
        case 'gif':
          type = 'gif'
          mimeType = 'image/gif'
          break
        default:
          type = 'unknown'
          mimeType = 'application/octet-stream'
      }
    }

    return {
      ...template,
      filePath: template.file_path,
      thumbnailPath: template.thumbnail_url,
      videoUrl: template.video_url,
      filename: template.name,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      isActive: template.is_active,
      fileSize: template.file_size,
      type: type,
      mimeType: mimeType,
    }
  })
}

export const getTargetTemplateById = async id => {
  const { data, error } = await supabase
    .from('target_templates')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"

  if (!data) return null

  // Apply same transformation as getTargetTemplates for consistency
  const template = data

  // Determine type and mimeType from file extension if not set
  let type = template.type
  let mimeType = template.mime_type

  if (!type || !mimeType) {
    const fileName = template.name || template.file_path || ''
    const extension = fileName.toLowerCase().split('.').pop()

    switch (extension) {
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'webm':
        type = 'video'
        mimeType = `video/${extension === 'mov' ? 'quicktime' : extension}`
        break
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        type = 'image'
        mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
        break
      case 'gif':
        type = 'gif'
        mimeType = 'image/gif'
        break
      default:
        type = 'unknown'
        mimeType = 'application/octet-stream'
    }
  }

  return {
    ...template,
    filePath: template.file_path,
    thumbnailPath: template.thumbnail_url,
    videoUrl: template.video_url,
    filename: template.name,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
    isActive: template.is_active,
    fileSize: template.file_size,
    type: type,
    mimeType: mimeType,
  }
}

export const createTargetTemplate = async templateData => {
  const { data, error } = await supabase
    .from('target_templates')
    .insert([
      {
        ...templateData,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTargetTemplate = async (id, updates) => {
  const { data, error } = await supabase
    .from('target_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTargetTemplate = async id => {
  const { data, error } = await supabase
    .from('target_templates')
    .delete()
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Generated Media operations
export const createGeneratedMedia = async mediaData => {
  const { data, error } = await supabase
    .from('generated_media')
    .insert([
      {
        ...mediaData,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getGeneratedMediaByUser = async userId => {
  let query = supabase
    .from('generated_media')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // If userId is provided, filter by user, otherwise get all (for demo purposes)
  if (userId) {
    query = query.eq('author_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  // Convert snake_case to camelCase for UI compatibility
  return data.map(media => ({
    ...media,
    // Original Prisma schema fields
    name: media.name,
    type: media.type,
    tempPath: media.temp_path,
    filePath: media.file_path,
    fileSize: media.file_size,
    mimeType: media.mime_type,
    createdAt: media.created_at,
    downloadCount: media.download_count,
    isPaid: media.is_paid,
    isActive: media.is_active,
    authorId: media.author_id,
    templateId: media.template_id,
    faceSourceId: media.face_source_id,
    duration: media.duration ? parseFloat(media.duration) : 0,
    // Legacy fields for compatibility
    filename: media.output_filename || media.name,
    outputFilename: media.output_filename || media.name,
    processingStatus: media.processing_status,
    updatedAt: media.updated_at,
  }))
}

export const getGeneratedMediaById = async id => {
  const { data, error } = await supabase
    .from('generated_media')
    .select(
      `
      *,
      face_source:face_sources(*),
      target_template:target_templates(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const updateGeneratedMedia = async (id, updates) => {
  const { data, error } = await supabase
    .from('generated_media')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteGeneratedMedia = async id => {
  const { data, error } = await supabase
    .from('generated_media')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Additional helper functions for specific operations
export const getGeneratedMediaByName = async name => {
  const { data, error } = await supabase
    .from('generated_media')
    .select('*')
    .eq('name', name)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const deleteGeneratedMediaById = async id => {
  const { error } = await supabase.from('generated_media').delete().eq('id', id)

  if (error) throw error
  return true
}

export const getTargetTemplateByName = async name => {
  const { data, error } = await supabase
    .from('target_templates')
    .select('*')
    .or(`name.eq.${name},filename.eq.${name}`)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Payment operations
export const createPayment = async paymentData => {
  // Map new field names to old field names for compatibility
  const dbPaymentData = {
    ...paymentData,
    // Map new fields to old fields (required for database)
    payment_status: paymentData.status || paymentData.payment_status || 'completed',
    payment_method: paymentData.type === 'fiat' ? 'stripe' : paymentData.payment_method || 'stripe',
    // Keep new fields as well
    status: paymentData.status || 'completed',
    type: paymentData.type || 'fiat',
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('payments').insert([dbPaymentData]).select().single()

  if (error) {
    console.error('Payment creation error:', error)
    throw error
  }
  return data
}

export const getPaymentsByUser = async userId => {
  let query = supabase.from('payments').select('*').order('created_at', { ascending: false })

  // If userId is provided, filter by user, otherwise get all (for demo purposes)
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export const updatePayment = async (id, updates) => {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Guidelines operations
export const getGuidelines = async () => {
  const { data, error } = await supabase
    .from('guidelines')
    .select('*')
    // Remove the is_allowed filter to show all 8 guidelines
    .order('created_at', { ascending: false })

  if (error) throw error

  // Convert snake_case to camelCase for UI compatibility
  return data.map(guideline => ({
    ...guideline,
    filePath: guideline.file_path,
    fileType: guideline.file_type,
    fileSize: guideline.file_size,
    isAllowed: guideline.is_allowed,
    createdAt: guideline.created_at,
    updatedAt: guideline.updated_at,
  }))
}

export const createGuideline = async guidelineData => {
  const { data, error } = await supabase
    .from('guidelines')
    .insert([
      {
        ...guidelineData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

// Database operations object
const db = {
  // Users
  createUser,
  findUserByEmail,
  findUserById,
  getUserByEmail,
  updateUser,
  updateUserLastLogin,
  updateUserLastLogout,
  upsertUser,

  // Face Sources
  createFaceSource,
  getFaceSourcesByUser,
  getFaceSourceById,
  getFaceSourceByFilename,
  updateFaceSource,
  deleteFaceSource,

  // Target Templates
  getTargetTemplates,
  getTargetTemplateById,
  createTargetTemplate,
  updateTargetTemplate,
  deleteTargetTemplate,

  // Generated Media
  createGeneratedMedia,
  getGeneratedMediaByUser,
  getGeneratedMediaById,
  updateGeneratedMedia,
  deleteGeneratedMedia,
  getGeneratedMediaByName,
  deleteGeneratedMediaById,

  // Payments
  createPayment,
  getPaymentsByUser,
  updatePayment,

  // Guidelines
  getGuidelines,
  createGuideline,
}

export default db
