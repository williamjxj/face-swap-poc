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

async function checkMissingFiles() {
  console.log('🔍 Checking for missing files in Supabase Storage...\n')

  try {
    // Get all file paths from database
    const [generatedMedia, templates, faceSources, guidelines] = await Promise.all([
      db.generatedMedia.findMany({
        select: { id: true, filePath: true, tempPath: true, name: true },
      }),
      db.targetTemplate.findMany({
        select: { id: true, filePath: true, thumbnailPath: true, filename: true },
      }),
      db.faceSource.findMany({ select: { id: true, filePath: true, filename: true } }),
      db.guideline
        .findMany({ select: { id: true, filePath: true, filename: true } })
        .catch(() => []),
    ])

    const allFiles = [
      ...generatedMedia
        .map(m => ({ id: m.id, path: m.filePath, type: 'generated-media', name: m.name }))
        .filter(f => f.path),
      ...generatedMedia
        .map(m => ({ id: m.id, path: m.tempPath, type: 'generated-media-temp', name: m.name }))
        .filter(f => f.path),
      ...templates
        .map(t => ({ id: t.id, path: t.filePath, type: 'template-file', name: t.filename }))
        .filter(f => f.path),
      ...templates
        .map(t => ({
          id: t.id,
          path: t.thumbnailPath,
          type: 'template-thumbnail',
          name: t.filename,
        }))
        .filter(f => f.path),
      ...faceSources
        .map(f => ({ id: f.id, path: f.filePath, type: 'face-source', name: f.filename }))
        .filter(f => f.path),
      ...guidelines
        .map(g => ({ id: g.id, path: g.filePath, type: 'guideline', name: g.filename }))
        .filter(f => f.path),
    ]

    console.log(`📋 Found ${allFiles.length} file references in database\n`)

    const missingFiles = []
    const brokenFiles = []

    for (const file of allFiles) {
      if (!file.path.startsWith('http')) {
        const [bucket, ...pathParts] = file.path.split('/')
        const filePath = pathParts.join('/')

        if (bucket && filePath) {
          try {
            const { data, error } = await supabase.storage
              .from(bucket)
              .list(filePath.substring(0, filePath.lastIndexOf('/')) || '', {
                search: filePath.substring(filePath.lastIndexOf('/') + 1),
              })

            if (error || !data || data.length === 0) {
              missingFiles.push({
                ...file,
                bucket,
                filePath,
                error: error?.message || 'File not found',
              })
            }
          } catch (e) {
            brokenFiles.push({
              ...file,
              bucket,
              filePath,
              error: e.message,
            })
          }
        }
      }
    }

    if (missingFiles.length > 0) {
      console.log('❌ MISSING FILES:')
      console.log('=================\n')
      missingFiles.forEach(file => {
        console.log(`• ${file.type}: ${file.name}`)
        console.log(`  ID: ${file.id}`)
        console.log(`  Path: ${file.path}`)
        console.log(`  Error: ${file.error}`)
        console.log()
      })
    }

    if (brokenFiles.length > 0) {
      console.log('💔 BROKEN REFERENCES:')
      console.log('=====================\n')
      brokenFiles.forEach(file => {
        console.log(`• ${file.type}: ${file.name}`)
        console.log(`  ID: ${file.id}`)
        console.log(`  Path: ${file.path}`)
        console.log(`  Error: ${file.error}`)
        console.log()
      })
    }

    if (missingFiles.length === 0 && brokenFiles.length === 0) {
      console.log('✅ All files exist in Supabase Storage!')
    } else {
      console.log('🔧 RECOMMENDED ACTIONS:')
      console.log('=======================')
      console.log('1. Remove database records for missing files')
      console.log('2. Or upload missing files to the correct buckets')
      console.log('3. Check if files were moved or renamed')
    }
  } catch (error) {
    console.error('❌ Error checking files:', error)
  } finally {
    await db.$disconnect()
  }
}

checkMissingFiles()
