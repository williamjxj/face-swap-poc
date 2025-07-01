const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Storage bucket configuration
const buckets = {
  'face-sources': 'face-sources',
  'generated-outputs': 'generated-outputs',
  'template-videos': 'template-videos',
  'template-thumbnails': 'template-thumbnails',
  'guideline-images': 'guideline-images',
  assets: 'assets',
}

async function createBuckets() {
  console.log('Creating Supabase storage buckets...')

  for (const [localDir, bucketName] of Object.entries(buckets)) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      })

      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating bucket ${bucketName}:`, error)
      } else {
        console.log(`✅ Bucket ${bucketName} ready`)
      }
    } catch (err) {
      console.error(`Error with bucket ${bucketName}:`, err.message)
    }
  }
}

async function uploadFile(filePath, bucketName, remotePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(remotePath || fileName, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: true,
      })

    if (error) {
      console.error(`❌ Failed to upload ${filePath}:`, error.message)
      return false
    } else {
      console.log(`✅ Uploaded: ${filePath} → ${bucketName}/${remotePath || fileName}`)
      return true
    }
  } catch (err) {
    console.error(`❌ Error uploading ${filePath}:`, err.message)
    return false
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

async function uploadDirectory(localDir, bucketName) {
  const dirPath = path.join('./storage', localDir)

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`)
    return
  }

  console.log(`📁 Processing directory: ${dirPath}`)

  const files = fs.readdirSync(dirPath)
  let uploaded = 0
  let failed = 0

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isFile() && !file.startsWith('.')) {
      const success = await uploadFile(filePath, bucketName, file)
      if (success) {
        uploaded++
      } else {
        failed++
      }
    }
  }

  console.log(`📊 ${localDir}: ${uploaded} uploaded, ${failed} failed`)
}

async function main() {
  console.log('🚀 Starting file migration to Supabase Storage...')

  // Create buckets first
  await createBuckets()

  // Upload files from each directory
  for (const [localDir, bucketName] of Object.entries(buckets)) {
    await uploadDirectory(localDir, bucketName)
  }

  console.log('✅ File migration completed!')
}

main().catch(console.error)
