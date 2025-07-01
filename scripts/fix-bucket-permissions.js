const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBucketPermissions() {
  console.log('🔧 Fixing bucket permissions...\n')

  const bucketsToMakePublic = [
    'guideline-images',
    'template-thumbnails',
    'generated-outputs',
    'face-sources',
    'template-videos',
  ]

  try {
    // First, let's check current bucket status
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    console.log('📋 Current bucket status:')
    console.log('========================\n')

    for (const bucket of buckets) {
      const shouldBePublic = bucketsToMakePublic.includes(bucket.name)
      console.log(
        `• ${bucket.name}: ${bucket.public ? '✅ Public' : '❌ Private'}${shouldBePublic ? ' (needs to be public)' : ''}`
      )
    }

    console.log('\n🔧 Making buckets public...\n')

    // Make each bucket public
    for (const bucketName of bucketsToMakePublic) {
      const bucket = buckets.find(b => b.name === bucketName)

      if (!bucket) {
        console.log(`⚠️  Bucket '${bucketName}' not found, skipping...`)
        continue
      }

      if (bucket.public) {
        console.log(`✅ Bucket '${bucketName}' is already public`)
        continue
      }

      try {
        // Update bucket to be public
        const { data, error } = await supabase.storage.updateBucket(bucketName, {
          public: true,
        })

        if (error) {
          console.error(`❌ Error making '${bucketName}' public:`, error.message)
        } else {
          console.log(`✅ Successfully made '${bucketName}' public`)
        }
      } catch (updateError) {
        console.error(`❌ Error updating '${bucketName}':`, updateError.message)
      }
    }

    console.log('\n🔍 Verifying changes...\n')

    // Verify the changes
    const { data: updatedBuckets } = await supabase.storage.listBuckets()

    for (const bucketName of bucketsToMakePublic) {
      const bucket = updatedBuckets.find(b => b.name === bucketName)
      if (bucket) {
        console.log(`• ${bucketName}: ${bucket.public ? '✅ Public' : '❌ Still Private'}`)
      }
    }

    console.log('\n🧪 Testing image access...\n')

    // Test one of the guideline images
    const testUrl =
      'https://yunxidsqumhfushjcgyg.supabase.co/storage/v1/object/public/guideline-images/f1.png'

    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      console.log(`🔗 Test URL: ${testUrl}`)
      console.log(`📡 Status: ${response.status} ${response.statusText}`)

      if (response.status === 200) {
        console.log('🎉 SUCCESS! Images should now load properly.')
      } else {
        console.log('⚠️  Still getting errors. You may need to check Supabase dashboard manually.')
      }
    } catch (fetchError) {
      console.log(`❌ Test fetch error: ${fetchError.message}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixBucketPermissions()
