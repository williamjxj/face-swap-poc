import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'face-swap-poc',
    },
  },
})

// Storage helpers
export const uploadFile = async (bucket, path, file, options = {}) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      ...options,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

export const deleteFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).remove([path])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// Database helpers
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Real-time subscriptions
export const subscribeToTable = (table, callback, filter = '*') => {
  return supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter,
      },
      callback
    )
    .subscribe()
}

export default supabase
