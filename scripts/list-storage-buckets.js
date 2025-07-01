const { createClient } = require('@supabase/supabase-js')
const { db } = require('../src/lib/db.js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllStorageBuckets() {
  try {
    console.log('🔍 Checking Supabase Storage buckets...\n')

    // List all buckets in Supabase Storage
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('❌ Error listing buckets:', error)
      return
    }

    console.log('📦 ALL SUPABASE STORAGE BUCKETS:')
    console.log('================================\n')

    const expectedBuckets = [
      'generated-outputs',
      'template-videos',
      'template-thumbnails',
      'face-sources',
      'guideline-images',
      'assets',
    ]

    const usedBuckets = [
      'generated-outputs',
      'template-videos',
      'template-thumbnails',
      'face-sources',
      'guideline-images',
    ]

    for (const bucket of buckets) {
      const isExpected = expectedBuckets.includes(bucket.name)
      const isUsed = usedBuckets.includes(bucket.name)

      let status = '❓ Unknown'
      if (isUsed) {
        status = '✅ Used by app'
      } else if (isExpected) {
        status = '⚠️ Expected but unused'
      } else {
        status = '🗑️ Can be deleted'
      }

      // Try to get file count in bucket
      let fileCount = 'unknown'
      try {
        const { data: files } = await supabase.storage.from(bucket.name).list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        })
        fileCount = files ? files.length : 0
      } catch {
        fileCount = 'error'
      }

      console.log(`  • ${bucket.name}: ${status} (${fileCount} files)`)
      console.log(`    Created: ${new Date(bucket.created_at).toLocaleDateString()}`)
      console.log(`    Updated: ${new Date(bucket.updated_at).toLocaleDateString()}`)
      console.log(`    Public: ${bucket.public ? 'Yes' : 'No'}`)
      console.log()
    }

    console.log('🧹 CLEANUP ACTIONS:')
    console.log('==================\n')

    const bucketsToDelete = buckets.filter(bucket => !usedBuckets.includes(bucket.name))

    if (bucketsToDelete.length > 0) {
      console.log('🗑️ Buckets that can be safely deleted:')
      bucketsToDelete.forEach(bucket => {
        console.log(`  • ${bucket.name}`)
      })

      console.log('\n📋 To delete these buckets:')
      console.log('1. Go to Supabase Dashboard → Storage')
      console.log('2. Click on each bucket listed above')
      console.log('3. Delete all files inside (if any)')
      console.log('4. Delete the empty bucket')
      console.log()
      console.log('⚠️ WARNING: Make sure to backup any important files first!')
    } else {
      console.log('✅ No unused buckets found - your storage is clean!')
    }

    console.log('\n📊 SUMMARY:')
    console.log(`  • Total buckets in Supabase: ${buckets.length}`)
    console.log(`  • Buckets used by app: ${usedBuckets.length}`)
    console.log(`  • Buckets to delete: ${bucketsToDelete.length}`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

listAllStorageBuckets()
