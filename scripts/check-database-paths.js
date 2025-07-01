const { db } = require('../src/lib/db.js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function checkDatabasePaths() {
  console.log('🔍 Checking database file paths...\n')

  try {
    // Get all current records
    const [templates, faceSources, generatedMedia] = await Promise.all([
      db.targetTemplate.findMany({
        select: {
          id: true,
          filename: true,
          filePath: true,
          thumbnailPath: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.faceSource.findMany({
        select: {
          id: true,
          filename: true,
          filePath: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.generatedMedia.findMany({
        select: {
          id: true,
          name: true,
          filePath: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    console.log('📹 TARGET TEMPLATES:')
    console.log('===================')
    templates.forEach(template => {
      console.log(`• ${template.filename}`)
      console.log(`  ID: ${template.id}`)
      console.log(`  File Path: ${template.filePath}`)
      console.log(`  Thumbnail: ${template.thumbnailPath || 'None'}`)
      console.log(`  Created: ${template.createdAt}`)
      console.log()
    })

    console.log('👤 FACE SOURCES:')
    console.log('================')
    faceSources.forEach(source => {
      console.log(`• ${source.filename}`)
      console.log(`  ID: ${source.id}`)
      console.log(`  File Path: ${source.filePath}`)
      console.log(`  Created: ${source.createdAt}`)
      console.log()
    })

    console.log('🎬 GENERATED MEDIA (Recent):')
    console.log('============================')
    generatedMedia.forEach(media => {
      console.log(`• ${media.name}`)
      console.log(`  ID: ${media.id}`)
      console.log(`  File Path: ${media.filePath}`)
      console.log(`  Created: ${media.createdAt}`)
      console.log()
    })

    // Identify problematic paths
    const allPaths = [
      ...templates.map(t => ({ id: t.id, path: t.filePath, type: 'template', name: t.filename })),
      ...templates
        .map(t => ({ id: t.id, path: t.thumbnailPath, type: 'template-thumb', name: t.filename }))
        .filter(p => p.path),
      ...faceSources.map(f => ({
        id: f.id,
        path: f.filePath,
        type: 'face-source',
        name: f.filename,
      })),
      ...generatedMedia.map(m => ({ id: m.id, path: m.filePath, type: 'generated', name: m.name })),
    ]

    const problematicPaths = allPaths.filter(
      item =>
        item.path &&
        (item.path.startsWith('/videos/') ||
          item.path.startsWith('/sources/') ||
          item.path.startsWith('/') ||
          !item.path.includes('/'))
    )

    if (problematicPaths.length > 0) {
      console.log('⚠️ PROBLEMATIC PATHS FOUND:')
      console.log('===========================')
      problematicPaths.forEach(item => {
        console.log(`• ${item.type}: ${item.name}`)
        console.log(`  ID: ${item.id}`)
        console.log(`  Bad Path: ${item.path}`)
        console.log()
      })
    } else {
      console.log('✅ All paths look correct!')
    }
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await db.$disconnect()
  }
}

checkDatabasePaths()
