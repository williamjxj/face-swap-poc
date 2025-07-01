const { db } = require('../src/lib/db.js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function cleanupOrphanedRecords() {
  console.log('🧹 Cleaning up orphaned database records...\n')

  try {
    // IDs of records to delete (from the missing files check)
    const orphanedRecords = {
      generatedMedia: [
        '23e7cd0d-50f2-4fcb-87c4-06b9f3ccf565', // 1748315755125_image_1748527789184.mp4
        '118c0fd9-de2a-4a2d-a790-e84a364900a2', // 1748315755125_image_1748531084061.mp4
      ],
      targetTemplate: [
        'c2f32406-796d-44a9-a62d-56f094824af1', // video.mp4 (both file and thumbnail missing)
      ],
      faceSource: [
        'ebc3b796-8093-47c9-adaf-5250214f21c0', // 1748312978896_image.png
        'a326e16e-3acc-4347-83d2-ef71b4640a87', // 1748314438931_image.png
        'c61cbd19-fc37-4427-8eff-cda34ddd06ae', // 1748315092501_image.png
      ],
    }

    let totalDeleted = 0

    // Delete orphaned generated media records
    if (orphanedRecords.generatedMedia.length > 0) {
      console.log('🗑️ Deleting orphaned generated media records...')
      const result = await db.generatedMedia.deleteMany({
        where: {
          id: {
            in: orphanedRecords.generatedMedia,
          },
        },
      })
      console.log(`✅ Deleted ${result.count} generated media records`)
      totalDeleted += result.count
    }

    // Delete orphaned template records
    if (orphanedRecords.targetTemplate.length > 0) {
      console.log('🗑️ Deleting orphaned template records...')
      const result = await db.targetTemplate.deleteMany({
        where: {
          id: {
            in: orphanedRecords.targetTemplate,
          },
        },
      })
      console.log(`✅ Deleted ${result.count} template records`)
      totalDeleted += result.count
    }

    // Delete orphaned face source records
    if (orphanedRecords.faceSource.length > 0) {
      console.log('🗑️ Deleting orphaned face source records...')
      const result = await db.faceSource.deleteMany({
        where: {
          id: {
            in: orphanedRecords.faceSource,
          },
        },
      })
      console.log(`✅ Deleted ${result.count} face source records`)
      totalDeleted += result.count
    }

    console.log(`\n🎉 Cleanup completed! Deleted ${totalDeleted} orphaned records total.`)
    console.log('\nℹ️ This should resolve:')
    console.log('• 400 errors for missing thumbnail files')
    console.log('• Display issues with missing templates')
    console.log('• Missing face source references')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await db.$disconnect()
  }
}

// Add confirmation
console.log('⚠️ WARNING: This will permanently delete orphaned database records!')
console.log('These records reference files that no longer exist in Supabase Storage.')
console.log('Press Ctrl+C within 5 seconds to cancel...\n')

setTimeout(() => {
  cleanupOrphanedRecords().catch(console.error)
}, 5000)
