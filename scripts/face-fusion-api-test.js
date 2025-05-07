const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const dotenv = require('dotenv');

dotenv.config();

const CREATE_TASK_URL = process.env.CREATE_TASK_URL
const QUERY_TASK_URL = process.env.QUERY_TASK_URL

if (!CREATE_TASK_URL || !QUERY_TASK_URL) {
  console.error('Error: Environment variables CREATE_TASK_URL and QUERY_TASK_URL must be set.');
  process.exit(1);
}

/**
 * Test Suite for Face Fusion API
 */
class FaceFusionAPITester {
  constructor() {
    this.outputPath = null;
  }

  /**
   * Test creation of a face fusion task
   * @param {string} sourcePath - Path to source image file
   * @param {string} targetPath - Path to target video file
   * @returns {Promise<string>} - Output path of the created task
   */
  async testCreateTask(sourcePath, targetPath) {
    console.log('\n🚀 Testing Create Task Endpoint...');
    
    try {
      // Validate files exist before sending
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }
      
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Target file not found: ${targetPath}`);
      }
      
      // Create form data
      const form = new FormData();
      form.append('source', fs.createReadStream(sourcePath));
      form.append('target', fs.createReadStream(targetPath));
      
      console.log(`📤 Uploading source image: ${path.basename(sourcePath)}`);
      console.log(`📤 Uploading target video: ${path.basename(targetPath)}`);
      
      // Send POST request
      const response = await axios.post(CREATE_TASK_URL, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
      });
      
      if (response.status === 200 && response.data.output_path) {
        console.log('✅ Task created successfully!');
        console.log(`📝 Output path: ${response.data.output_path}`);
        this.outputPath = response.data.output_path;
        return response.data.output_path;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Create Task Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response body:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Test querying a task result
   * @param {string} outputPath - Path identifier from create task response
   * @param {string} savePath - Path to save the result file
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} retryDelay - Delay between retries in ms
   * @returns {Promise<boolean>} - True if task completed successfully
   */
  async testQueryTaskResult(outputPath, savePath, maxRetries = 10, retryDelay = 5000) {
    console.log('\n🔍 Testing Query Task Result Endpoint...');
    console.log(`📝 Using output path: ${outputPath}`);

    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`\n📡 Attempt ${retries + 1}/${maxRetries} - Checking task status...`);
        
        const response = await axios.post(
          QUERY_TASK_URL,
          { output_path: outputPath },
          { 
            headers: { 'Content-Type': 'application/json' },
            responseType: 'stream' 
          }
        );
        
        // Check if the response is a JSON status message
        let jsonResponse = null;
        let isJSON = false;
        
        // We need to inspect the first chunk to determine if it's JSON
        const firstChunk = await new Promise((resolve) => {
          response.data.once('data', (chunk) => {
            resolve(chunk);
          });
        });
        
        try {
          // Try to parse as JSON
          jsonResponse = JSON.parse(firstChunk.toString());
          isJSON = true;
        } catch (e) {
          // Not JSON, likely a binary file
          isJSON = false;
        }
        
        if (isJSON) {
          // Handle JSON response (status update)
          if (jsonResponse.status === 'processing') {
            console.log('⏳ Task is still processing. Waiting before retry...');
            await sleep(retryDelay);
            retries++;
            continue;
          } else if (jsonResponse.status === 'error') {
            console.error(`❌ Task failed: ${jsonResponse.message}`);
            return false;
          }
        } else {
          // Handle binary response (file download)
          console.log('✅ Task completed successfully!');
          
          // Create write stream for saving file
          const fileType = response.headers['content-type'] || '';
          const extension = fileType.includes('video') ? 'mp4' : 'png';
          const finalSavePath = savePath || `output.${extension}`;
          
          // Create a new readable stream from the first chunk and the rest of the response
          const combinedStream = require('stream').Readable.from(Buffer.concat([
            firstChunk,
            await streamToBuffer(response.data)
          ]));
          
          // Save the file
          await pipeline(
            combinedStream,
            createWriteStream(finalSavePath)
          );
          
          console.log(`💾 Result saved to: ${finalSavePath}`);
          return true;
        }
      } catch (error) {
        console.error('❌ Query Task Error:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          try {
            console.error('Response body:', error.response.data);
          } catch (e) {
            console.error('Could not parse response body');
          }
        }
        
        if (retries < maxRetries - 1) {
          console.log(`Retrying in ${retryDelay/1000} seconds...`);
          await sleep(retryDelay);
          retries++;
        } else {
          console.error('Max retries reached. Task querying failed.');
          return false;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Run a complete end-to-end test
   * @param {string} sourcePath - Path to source image file
   * @param {string} targetPath - Path to target video file
   * @param {string} savePath - Path to save the result file
   */
  async runE2ETest(sourcePath, targetPath, savePath) {
    console.log('\n🧪 Running End-to-End Face Fusion API Test 🧪');
    console.log('-------------------------------------------');
    
    try {
      // Step 1: Create task
      const outputPath = await this.testCreateTask(sourcePath, targetPath);
      
      // Step 2: Query result and download file
      const success = await this.testQueryTaskResult(outputPath, savePath);
      
      if (success) {
        console.log('\n🎉 End-to-End Test PASSED! 🎉');
      } else {
        console.log('\n❌ End-to-End Test FAILED');
      }
    } catch (error) {
      console.error('\n💥 Test Failed with error:', error.message);
    }
  }
}

/**
 * Convert a stream to a buffer
 * @param {ReadableStream} stream - The stream to convert
 * @returns {Promise<Buffer>} - The stream as a buffer
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Export the test class
module.exports = FaceFusionAPITester;

function main() {
  // Example usage (uncomment to run directly)
  const tester = new FaceFusionAPITester();
  
  // Replace with your actual file paths
  const sourcePath = './src/assets/lisa.png'; 
  const targetPath = './src/assets/1.mp4';
  const savePath = './src/assets/result.mp4';

  tester.runE2ETest(sourcePath, targetPath, savePath)
    .then(() => console.log('Test completed'))
    .catch(err => console.error('Test failed:', err));
}