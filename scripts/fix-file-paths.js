const { db } = require('../src/lib/db.js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function fixFilePaths() {
  console.log('🔧 Fixing incorrect file paths...\n')

  try {
    // Fix the template record
    const templateUpdate = await db.targetTemplate.update({
      where: { id: 'a352d1b9-1dee-4097-8c57-971dc9f6075d' },
      data: {
        filePath: 'template-videos/ad1.mp4',
        thumbnailPath: 'template-thumbnails/ad1_thumbnail.webp',
      },
    })
    console.log('✅ Fixed template path:', templateUpdate.filename)
    console.log(`   File: ${templateUpdate.filePath}`)
    console.log(`   Thumbnail: ${templateUpdate.thumbnailPath}`)

    // Fix face source records
    const faceSource1Update = await db.faceSource.update({
      where: { id: '5c83f192-b4cb-4637-8636-fff1e9a1240a' },
      data: {
        filePath: 'face-sources/1751334910977_即梦2.png',
      },
    })
    console.log('✅ Fixed face source path:', faceSource1Update.filename)
    console.log(`   File: ${faceSource1Update.filePath}`)

    const faceSource2Update = await db.faceSource.update({
      where: { id: '8927e872-8eff-4b4c-82ae-b4d151e65efa' },
      data: {
        filePath: 'face-sources/1751334146562_即梦1.png',
      },
    })
    console.log('✅ Fixed face source path:', faceSource2Update.filename)
    console.log(`   File: ${faceSource2Update.filePath}`)

    console.log('\n🎉 All file paths have been corrected!')
    console.log('\nℹ️ Updated paths:')
    console.log('• Template videos → template-videos/ bucket')
    console.log('• Template thumbnails → template-thumbnails/ bucket')
    console.log('• Face sources → face-sources/ bucket')
  } catch (error) {
    console.error('❌ Error fixing paths:', error)
  } finally {
    await db.$disconnect()
  }
}

// Add confirmation
console.log('🔧 This will fix the incorrect file paths to use proper Supabase Storage buckets.')
console.log('Press Ctrl+C within 3 seconds to cancel...\n')

setTimeout(() => {
  fixFilePaths().catch(console.error)
}, 3000)
