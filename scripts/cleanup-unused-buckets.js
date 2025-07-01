const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backupBucketContents(bucketName, backupDir) {
  try {
    console.log(`📋 Checking contents of bucket: ${bucketName}`)

    const { data: files, error } = await supabase.storage.from(bucketName).list('', { limit: 1000 })

    if (error) {
      console.error(`❌ Error listing files in ${bucketName}:`, error)
      return false
    }

    if (!files || files.length === 0) {
      console.log(`✅ Bucket ${bucketName} is empty - safe to delete`)
      return true
    }

    console.log(`📁 Found ${files.length} files in ${bucketName}:`)
    files.forEach(file => {
      console.log(`   • ${file.name} (${file.metadata?.size || 'unknown'} bytes)`)
    })

    // Create backup directory
    const bucketBackupDir = path.join(backupDir, bucketName)
    if (!fs.existsSync(bucketBackupDir)) {
      fs.mkdirSync(bucketBackupDir, { recursive: true })
    }

    // Create a list of files for reference
    const fileList = files.map(file => ({
      name: file.name,
      size: file.metadata?.size,
      lastModified: file.metadata?.lastModified,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${file.name}`,
    }))

    fs.writeFileSync(
      path.join(bucketBackupDir, 'file-list.json'),
      JSON.stringify(fileList, null, 2)
    )

    console.log(`💾 File list saved to: ${path.join(bucketBackupDir, 'file-list.json')}`)
    console.log(
      `⚠️  Manual action needed: Review files and download important ones before deletion`
    )

    return true
  } catch (error) {
    console.error(`❌ Error backing up ${bucketName}:`, error)
    return false
  }
}

async function cleanupUnusedBuckets() {
  console.log('🧹 SUPABASE STORAGE CLEANUP')
  console.log('===========================\n')

  const bucketsToCleanup = [
    'target-templates',
    'generated-media',
    'thumbnails',
    'guidelines',
    'assets',
  ]

  const backupDir = './storage-backup'
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log(`📂 Creating backup directory: ${backupDir}\n`)

  for (const bucketName of bucketsToCleanup) {
    console.log(`\n🔍 Processing bucket: ${bucketName}`)
    console.log('='.repeat(40))

    const success = await backupBucketContents(bucketName, backupDir)

    if (success) {
      console.log(`✅ ${bucketName} processed successfully`)
    } else {
      console.log(`❌ Failed to process ${bucketName}`)
    }
  }

  console.log('\n📋 CLEANUP SUMMARY')
  console.log('==================')
  console.log('1. ✅ Backup information created in ./storage-backup/')
  console.log('2. 🔍 Review the file lists and download any important files')
  console.log('3. 🗑️ Manually delete these buckets from Supabase Dashboard:')
  bucketsToCleanup.forEach(bucket => {
    console.log(`   • ${bucket}`)
  })

  console.log('\n⚠️  MANUAL DELETION STEPS:')
  console.log('1. Go to Supabase Dashboard → Storage')
  console.log('2. For each bucket listed above:')
  console.log('   a. Click on the bucket name')
  console.log('   b. Delete all files inside')
  console.log('   c. Go back and delete the empty bucket')
  console.log('3. Keep only these 5 buckets:')
  console.log('   • face-sources')
  console.log('   • generated-outputs')
  console.log('   • template-videos')
  console.log('   • template-thumbnails')
  console.log('   • guideline-images')

  console.log('\n✅ After cleanup, you should have exactly 5 buckets in Supabase Storage.')
}

cleanupUnusedBuckets().catch(console.error)
