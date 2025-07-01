const { db } = require('../src/lib/db.js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function cleanupTestRecords() {
  console.log('🧹 Cleaning up test records with missing files...\n')

  try {
    // IDs of the records we need to clean up (the ones we just corrected but files don't exist)
    const orphanedRecords = {
      targetTemplate: [
        'a352d1b9-1dee-4097-8c57-971dc9f6075d', // ad1.mp4 (files don't exist in Supabase)
      ],
      faceSource: [
        '5c83f192-b4cb-4637-8636-fff1e9a1240a', // 1751334910977_即梦2.png
        '8927e872-8eff-4b4c-82ae-b4d151e65efa', // 1751334146562_即梦1.png
      ],
    }

    let totalDeleted = 0

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
    console.log('\nℹ️ This should resolve the database inconsistencies.')
    console.log(
      'Now you can upload files again and they will use the correct Supabase Storage paths.'
    )
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await db.$disconnect()
  }
}

// Add confirmation
console.log('⚠️ WARNING: This will delete the test records that have missing files!')
console.log('Press Ctrl+C within 3 seconds to cancel...\n')

setTimeout(() => {
  cleanupTestRecords().catch(console.error)
}, 3000)
