#!/usr/bin/env node

/**
 * Script to move template files from guideline-images bucket to template-videos bucket
 * This fixes the issue where template uploads went to the wrong bucket
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function moveTemplateFiles() {
  try {
    console.log('🔍 Finding template files that need to be moved...')
    
    // Get all target_templates that point to guideline-images (these need files moved)
    const { data: templates, error: dbError } = await supabase
      .from('target_templates')
      .select('id, name, file_path, video_url')
      .or('file_path.like.template-videos/%,video_url.like.template-videos/%')
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log(`📋 Found ${templates.length} template records pointing to template-videos`)

    // For each template, check if the file exists in guideline-images and move it
    let movedCount = 0
    let errorCount = 0

    for (const template of templates) {
      const fileName = template.file_path.replace('template-videos/', '')
      const sourceFile = `guideline-images/${fileName}`
      const targetFile = `template-videos/${fileName}`

      console.log(`\n📁 Processing: ${template.name}`)
      console.log(`   Source: ${sourceFile}`)
      console.log(`   Target: ${targetFile}`)

      try {
        // Check if source file exists in guideline-images
        const { data: sourceExists, error: sourceError } = await supabase.storage
          .from('guideline-images')
          .download(fileName)

        if (sourceError) {
          console.log(`   ⚠️  Source file not found in guideline-images: ${sourceError.message}`)
          continue
        }

        // Check if target file already exists in template-videos
        const { data: targetExists, error: targetError } = await supabase.storage
          .from('template-videos')
          .download(fileName)

        if (!targetError) {
          console.log(`   ✅ File already exists in template-videos, skipping`)
          continue
        }

        // Copy file from guideline-images to template-videos
        console.log(`   📤 Copying file to template-videos...`)
        
        const { error: uploadError } = await supabase.storage
          .from('template-videos')
          .upload(fileName, sourceExists, {
            contentType: template.name.endsWith('.mp4') ? 'video/mp4' : 
                        template.name.endsWith('.png') ? 'image/png' :
                        template.name.endsWith('.jpg') || template.name.endsWith('.jpeg') ? 'image/jpeg' :
                        template.name.endsWith('.gif') ? 'image/gif' : 'application/octet-stream'
          })

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }

        // Delete file from guideline-images
        console.log(`   🗑️  Removing file from guideline-images...`)
        
        const { error: deleteError } = await supabase.storage
          .from('guideline-images')
          .remove([fileName])

        if (deleteError) {
          console.log(`   ⚠️  Warning: Could not delete source file: ${deleteError.message}`)
        }

        console.log(`   ✅ Successfully moved file`)
        movedCount++

      } catch (error) {
        console.error(`   ❌ Error moving file: ${error.message}`)
        errorCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Files moved: ${movedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📋 Total processed: ${templates.length}`)

    if (movedCount > 0) {
      console.log(`\n🎉 File migration completed! Template images should now be visible.`)
    } else {
      console.log(`\n💡 No files needed to be moved. All templates are already in the correct bucket.`)
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
moveTemplateFiles()
