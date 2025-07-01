const { db } = require('../src/lib/db.js')

async function analyzeStorageUsage() {
  try {
    console.log('🔍 Analyzing current storage bucket usage...\n')

    // Get all file paths from different tables
    const [generatedMedia, templates, faceSources, guidelines] = await Promise.all([
      db.generatedMedia.findMany({ select: { filePath: true, tempPath: true } }),
      db.targetTemplate.findMany({ select: { filePath: true, thumbnailPath: true } }),
      db.faceSource.findMany({ select: { filePath: true } }),
      db.guideline.findMany({ select: { filePath: true } }).catch(() => []), // Handle if table doesn't exist
    ])

    // Extract all file paths
    const allPaths = [
      ...generatedMedia.map(m => m.filePath).filter(Boolean),
      ...generatedMedia.map(m => m.tempPath).filter(Boolean),
      ...templates.map(t => t.filePath).filter(Boolean),
      ...templates.map(t => t.thumbnailPath).filter(Boolean),
      ...faceSources.map(f => f.filePath).filter(Boolean),
      ...guidelines.map(g => g.filePath).filter(Boolean),
    ]

    // Analyze bucket usage
    const bucketUsage = {}
    const unknownPaths = []

    allPaths.forEach(path => {
      if (!path) return

      // Extract bucket name (first part of path)
      const parts = path.split('/')
      const bucket = parts[0]

      if (bucket && bucket !== '' && !path.startsWith('http')) {
        if (!bucketUsage[bucket]) {
          bucketUsage[bucket] = 0
        }
        bucketUsage[bucket]++
      } else {
        unknownPaths.push(path)
      }
    })

    // Display results
    console.log('📊 STORAGE BUCKET USAGE ANALYSIS')
    console.log('================================\n')

    console.log('🗂️ Currently Used Buckets:')
    Object.entries(bucketUsage)
      .sort(([, a], [, b]) => b - a)
      .forEach(([bucket, count]) => {
        console.log(`  • ${bucket}: ${count} files`)
      })

    console.log('\n📝 Expected Buckets (from storage-helper.js):')
    const expectedBuckets = [
      'generated-outputs',
      'template-videos',
      'template-thumbnails',
      'face-sources',
      'guideline-images',
      'assets',
    ]
    expectedBuckets.forEach(bucket => {
      const used = bucketUsage[bucket] || 0
      console.log(`  • ${bucket}: ${used > 0 ? `✅ ${used} files` : '❌ unused'}`)
    })

    if (unknownPaths.length > 0) {
      console.log('\n⚠️ Unknown/External Paths:')
      unknownPaths.slice(0, 10).forEach(path => {
        console.log(`  • ${path}`)
      })
      if (unknownPaths.length > 10) {
        console.log(`  ... and ${unknownPaths.length - 10} more`)
      }
    }

    // Identify buckets to clean up
    const usedBuckets = new Set(Object.keys(bucketUsage))
    const expectedBucketsSet = new Set(expectedBuckets)

    console.log('\n🧹 CLEANUP RECOMMENDATIONS')
    console.log('===========================\n')

    const unusedExpectedBuckets = expectedBuckets.filter(b => !usedBuckets.has(b))
    const unexpectedUsedBuckets = [...usedBuckets].filter(b => !expectedBucketsSet.has(b))

    if (unusedExpectedBuckets.length > 0) {
      console.log('📦 Unused Expected Buckets (safe to delete if empty):')
      unusedExpectedBuckets.forEach(bucket => {
        console.log(`  • ${bucket}`)
      })
    }

    if (unexpectedUsedBuckets.length > 0) {
      console.log('\n❓ Unexpected Buckets (check if they contain old/duplicate data):')
      unexpectedUsedBuckets.forEach(bucket => {
        console.log(`  • ${bucket}: ${bucketUsage[bucket]} files`)
      })
    }

    console.log('\n✅ Buckets to Keep:')
    expectedBuckets
      .filter(b => usedBuckets.has(b))
      .forEach(bucket => {
        console.log(`  • ${bucket}: ${bucketUsage[bucket]} files`)
      })

    console.log('\n📋 Summary:')
    console.log(`  • Total unique file paths: ${allPaths.length}`)
    console.log(`  • Active buckets: ${Object.keys(bucketUsage).length}`)
    console.log(`  • Expected buckets: ${expectedBuckets.length}`)
  } catch (error) {
    console.error('❌ Analysis error:', error)
  } finally {
    await db.$disconnect()
  }
}

analyzeStorageUsage()
