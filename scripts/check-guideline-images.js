const { createClient } = require('@supabase/supabase-js')
const { db } = require('../src/lib/db.js')

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

async function checkGuidelineImages() {
  console.log('🔍 Checking guideline images...\n')

  try {
    // Get all guidelines from database
    const guidelines = await db.guideline.findMany({
      select: { id: true, filePath: true, filename: true, isAllowed: true },
    })

    console.log(`📋 Found ${guidelines.length} guidelines in database:\n`)

    for (const guideline of guidelines) {
      console.log(`• ${guideline.filename} (${guideline.isAllowed ? 'Allowed' : 'Not Allowed'})`)
      console.log(`  ID: ${guideline.id}`)
      console.log(`  Path: ${guideline.filePath}`)

      // Check if file exists in storage
      const [bucket, ...pathParts] = guideline.filePath.split('/')
      const filePath = pathParts.join('/')

      if (bucket && filePath) {
        try {
          // Check if file exists
          const { data: fileData, error: fileError } = await supabase.storage
            .from(bucket)
            .list(filePath.substring(0, filePath.lastIndexOf('/')) || '', {
              search: filePath.substring(filePath.lastIndexOf('/') + 1),
            })

          if (fileError || !fileData || fileData.length === 0) {
            console.log(`  ❌ File not found in storage`)
          } else {
            console.log(`  ✅ File exists in storage`)
          }

          // Check public URL accessibility
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
          console.log(`  🔗 Public URL: ${urlData.publicUrl}`)

          // Try to fetch the URL to see if it's accessible
          try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' })
            console.log(`  📡 HTTP Status: ${response.status} ${response.statusText}`)
            
            if (response.status === 400) {
              console.log(`  ⚠️  This is the 400 error we're seeing!`)
            }
          } catch (fetchError) {
            console.log(`  ❌ Fetch error: ${fetchError.message}`)
          }

        } catch (e) {
          console.log(`  💥 Error checking file: ${e.message}`)
        }
      }
      console.log()
    }

    // Check bucket policy
    console.log('🔒 Checking bucket policy for guideline-images...\n')
    
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const guidelineBucket = buckets.find(b => b.name === 'guideline-images')
      
      if (guidelineBucket) {
        console.log(`Bucket: ${guidelineBucket.name}`)
        console.log(`Public: ${guidelineBucket.public}`)
        console.log(`Created: ${new Date(guidelineBucket.created_at).toLocaleString()}`)
        console.log(`Updated: ${new Date(guidelineBucket.updated_at).toLocaleString()}`)
        
        if (!guidelineBucket.public) {
          console.log('\n⚠️  ISSUE FOUND: The guideline-images bucket is NOT public!')
          console.log('This is likely why you\'re getting 400 errors.')
          console.log('\n🔧 TO FIX:')
          console.log('1. Go to Supabase Dashboard → Storage')
          console.log('2. Click on "guideline-images" bucket')
          console.log('3. Click "Settings" or "Edit"')
          console.log('4. Enable "Public bucket" option')
          console.log('5. Save changes')
        }
      }
    } catch (bucketError) {
      console.log(`❌ Error checking bucket policy: ${bucketError.message}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkGuidelineImages()
