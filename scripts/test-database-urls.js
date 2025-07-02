#!/usr/bin/env node

/**
 * Database URL Connection Tester
 * Tests multiple DATABASE_URL formats to find the working one
 */

const { PrismaClient } = require('@prisma/client')

// Test cases for different DATABASE_URL formats
/**
 * - The password FaceSwapPOC2025!Secure! is correct
 * - Port 6543 (connection pooling) works, port 5432 (direct) is blocked
 * - Unescaped exclamation marks work fine in this environment
 * - URL encoding (%21) also works as an alternative
 * - Backslash escaping (\!) doesn't work with Prisma/PostgreSQL
 */
const testCases = [
  {
    name: 'Test 1: Direct connection port 5432',
    url: 'postgresql://postgres:FaceSwapPOC2025!Secure!@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres',
  },
  {
    name: 'Test 2: Connection pooling port 6543 (recommended)',
    url: 'postgresql://postgres:FaceSwapPOC2025!Secure!@db.yunxidsqumhfushjcgyg.supabase.co:6543/postgres',
  },
  {
    name: 'Test 3: URL encoded exclamation marks (%21) with pooling',
    url: 'postgresql://postgres:FaceSwapPOC2025%21Secure%21@db.yunxidsqumhfushjcgyg.supabase.co:6543/postgres',
  },
  {
    name: 'Test 4: Escaped exclamation marks with pooling',
    url: 'postgresql://postgres:FaceSwapPOC2025\\!Secure\\!@db.yunxidsqumhfushjcgyg.supabase.co:6543/postgres',
  },
]

async function testDatabaseConnection(testCase) {
  console.log(`\n🔍 ${testCase.name}`)
  console.log(`URL: ${testCase.url}`)

  let prisma
  try {
    // Create Prisma client with the test URL
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testCase.url,
        },
      },
    })

    // Test connection with a simple query
    console.log('   ⏳ Testing connection...')
    const result = await prisma.$queryRaw`SELECT 1 as test`

    if (result && result[0] && result[0].test === 1) {
      console.log('   ✅ SUCCESS: Connection established!')

      // Additional test: Check if we can query actual tables
      try {
        const userCount = await prisma.user.count()
        console.log(`   ✅ SUCCESS: Can query tables (found ${userCount} users)`)
        return { success: true, url: testCase.url, name: testCase.name }
      } catch (tableError) {
        console.log('   ⚠️  WARNING: Connected but cannot query tables:', tableError.message)
        return {
          success: true,
          url: testCase.url,
          name: testCase.name,
          warning: tableError.message,
        }
      }
    } else {
      console.log('   ❌ FAILED: Unexpected query result')
      return { success: false, error: 'Unexpected query result' }
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`)
    return { success: false, error: error.message }
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Database URL Connection Tests')
  console.log('='.repeat(60))

  const results = []

  for (const testCase of testCases) {
    const result = await testDatabaseConnection(testCase)
    results.push(result)

    // Add delay between tests to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  if (successful.length > 0) {
    console.log('\n✅ WORKING DATABASE URLs:')
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`)
      console.log(`   URL: ${result.url}`)
      if (result.warning) {
        console.log(`   ⚠️  Warning: ${result.warning}`)
      }
      console.log('')
    })

    console.log('🎉 RECOMMENDATION:')
    console.log(`Use this DATABASE_URL in your .env file:`)
    console.log(`DATABASE_URL="${successful[0].url}"`)
  } else {
    console.log('\n❌ NO WORKING DATABASE URLs FOUND')
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS:')
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name || 'Unknown'}: ${result.error}`)
    })
  }

  console.log('\n📝 NOTES:')
  console.log('- If all tests fail, check your Supabase project status')
  console.log('- Verify the password and project ID are correct')
  console.log('- Ensure your IP is allowed in Supabase settings')
  console.log('- For production, use connection pooling (port 6543)')
}

// Handle script execution
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✨ Testing completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { testDatabaseConnection, runAllTests }
