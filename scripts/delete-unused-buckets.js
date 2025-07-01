const { createClient } = require('@supabase/supabase-js')

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

async function deleteBucketAndContents(bucketName) {
  try {
    console.log(`🗑️  Deleting bucket: ${bucketName}`)

    // First, list all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 })

    if (listError) {
      console.error(`❌ Error listing files in ${bucketName}:`, listError.message)
      return false
    }

    // Delete all files if any exist
    if (files && files.length > 0) {
      console.log(`   📁 Found ${files.length} files to delete...`)

      const filePaths = files.map(file => file.name)
      const { error: deleteFilesError } = await supabase.storage.from(bucketName).remove(filePaths)

      if (deleteFilesError) {
        console.error(`❌ Error deleting files from ${bucketName}:`, deleteFilesError.message)
        return false
      }

      console.log(`   ✅ Deleted ${files.length} files`)
    } else {
      console.log(`   📭 Bucket is empty`)
    }

    // Now delete the empty bucket
    const { error: deleteBucketError } = await supabase.storage.deleteBucket(bucketName)

    if (deleteBucketError) {
      console.error(`❌ Error deleting bucket ${bucketName}:`, deleteBucketError.message)
      return false
    }

    console.log(`   ✅ Bucket ${bucketName} deleted successfully`)
    return true
  } catch (error) {
    console.error(`❌ Unexpected error deleting ${bucketName}:`, error.message)
    return false
  }
}

async function deleteUnusedBuckets() {
  console.log('🧹 AUTOMATED SUPABASE STORAGE CLEANUP')
  console.log('====================================\n')

  const bucketsToDelete = [
    'target-templates',
    'generated-media',
    'thumbnails',
    'guidelines',
    'assets',
  ]

  console.log('🗑️  Buckets to be deleted:')
  bucketsToDelete.forEach(bucket => {
    console.log(`   • ${bucket}`)
  })

  console.log('\n⚠️  WARNING: This will permanently delete these buckets and all their contents!')
  console.log('📋 Starting deletion in 3 seconds...\n')

  // Wait 3 seconds to give user time to cancel if needed
  await new Promise(resolve => setTimeout(resolve, 3000))

  let successCount = 0
  let failureCount = 0

  for (const bucketName of bucketsToDelete) {
    const success = await deleteBucketAndContents(bucketName)
    if (success) {
      successCount++
    } else {
      failureCount++
    }
    console.log() // Add spacing between buckets
  }

  console.log('📊 DELETION SUMMARY')
  console.log('==================')
  console.log(`✅ Successfully deleted: ${successCount} buckets`)
  console.log(`❌ Failed to delete: ${failureCount} buckets`)

  if (successCount > 0) {
    console.log('\n🎉 Cleanup completed!')
    console.log('Your Supabase Storage should now have only these 5 buckets:')
    console.log('   • face-sources')
    console.log('   • generated-outputs')
    console.log('   • template-videos')
    console.log('   • template-thumbnails')
    console.log('   • guideline-images')
  }

  if (failureCount > 0) {
    console.log('\n⚠️  Some buckets could not be deleted. Check the errors above.')
    console.log('You may need to delete them manually from the Supabase Dashboard.')
  }
}

// Add confirmation before running
console.log('🚨 IMPORTANT: This script will delete unused storage buckets!')
console.log('Press Ctrl+C within 5 seconds to cancel...\n')

setTimeout(() => {
  deleteUnusedBuckets().catch(console.error)
}, 5000)
