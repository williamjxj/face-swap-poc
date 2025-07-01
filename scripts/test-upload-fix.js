const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function testUploadFix() {
  console.log('🧪 Testing upload fix...\n')

  // Test with a small dummy file
  const testFileName = 'test-video.mp4'
  const testFileContent = Buffer.from('dummy video content for testing')
  
  // Create a temporary test file
  const tempFilePath = path.join(__dirname, testFileName)
  fs.writeFileSync(tempFilePath, testFileContent)

  try {
    console.log('📤 Testing first upload...')
    
    // First upload
    const formData1 = new FormData()
    formData1.append('file', fs.createReadStream(tempFilePath), {
      filename: testFileName,
      contentType: 'video/mp4'
    })
    formData1.append('templateType', 'video')

    const response1 = await fetch('http://localhost:3000/api/upload-template', {
      method: 'POST',
      body: formData1,
    })

    if (response1.ok) {
      const data1 = await response1.json()
      console.log('✅ First upload successful!')
      console.log('   Filename:', data1.filename)
      console.log('   File Path:', data1.filePath)
      console.log('   ID:', data1.id)
    } else {
      const error1 = await response1.text()
      console.log('❌ First upload failed:', error1)
      return
    }

    console.log('\n📤 Testing second upload (same file)...')
    
    // Second upload with same file
    const formData2 = new FormData()
    formData2.append('file', fs.createReadStream(tempFilePath), {
      filename: testFileName,
      contentType: 'video/mp4'
    })
    formData2.append('templateType', 'video')

    const response2 = await fetch('http://localhost:3000/api/upload-template', {
      method: 'POST',
      body: formData2,
    })

    if (response2.ok) {
      const data2 = await response2.json()
      console.log('✅ Second upload successful!')
      console.log('   Filename:', data2.filename)
      console.log('   File Path:', data2.filePath)
      console.log('   ID:', data2.id)
      console.log('\n🎉 SUCCESS: No more "resource already exists" errors!')
    } else {
      const error2 = await response2.text()
      console.log('❌ Second upload failed:', error2)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(tempFilePath)
      console.log('\n🧹 Cleaned up test file')
    } catch (cleanupError) {
      console.log('⚠️  Could not clean up test file:', cleanupError.message)
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/upload-template', {
      method: 'GET'
    })
    return response.status !== 404
  } catch (error) {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3000')
    console.log('Please start the server with: npm run dev')
    return
  }

  await testUploadFix()
}

main()
