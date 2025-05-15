import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import FormData from 'form-data';
import fetch from 'node-fetch';
import prisma from '../../../lib/prisma';

// Promisify the stream pipeline for async/await usage
const streamPipeline = promisify(pipeline);

// Environment variables for API endpoints (configure in .env.local)
const CREATE_API = process.env.MODAL_CREATE_API;
const QUERY_API = process.env.MODAL_QUERY_API;

// Maximum number of retry attempts for polling
const MAX_RETRIES = 60; // 5 minutes maximum (5 seconds × 60)
const POLLING_INTERVAL = 5000; // 5 seconds

export async function POST(request) {
  try {
    let sourceFile, targetFile;
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // Handle JSON request with file paths
      const { source, target } = await request.json();
      
      // Read files from public directory
      const publicDir = path.join(process.cwd(), 'public');
      const sourcePath = path.join(publicDir, source);
      const targetPath = path.join(publicDir, target);

      // Validate file existence
      if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
        return NextResponse.json({
          status: 'error',
          message: 'Source or target file not found'
        }, { status: 404 });
      }

      // Create file-like objects from the files
      sourceFile = {
        name: path.basename(source),
        type: source.endsWith('.png') ? 'image/png' : 'image/jpeg',
        arrayBuffer: async () => fs.promises.readFile(sourcePath)
      };

      targetFile = {
        name: path.basename(target),
        type: 'video/mp4',
        arrayBuffer: async () => fs.promises.readFile(targetPath)
      };
    } else {
      // Handle multipart form data
      const formData = await request.formData();
      sourceFile = formData.get('source');
      targetFile = formData.get('target');
    }

    // Validate inputs
    if (!sourceFile || !targetFile) {
      return NextResponse.json({
        status: 'error',
        message: 'Both source image and target video files are required'
      }, { status: 400 });
    }

    console.log('before createFusionTask: ', sourceFile, targetFile);
    // Step 1: Call CREATE_API to initiate face fusion task
    const outputPath = await createFusionTask(sourceFile, targetFile);

    console.log('Fusion task created successfully, output path:', outputPath);
    
    // Step 2: Poll QUERY_API to check task status
    const response = await pollTaskStatus(outputPath, sourceFile.name);
    
    // Since pollTaskStatus returns a NextResponse object, we need to extract the data
    const responseData = await response.json();
   
    if (!responseData || !responseData.filePath) {
      console.error('Error: Missing filePath in result', responseData);
      return NextResponse.json({ error: 'Failed to process video - missing path information' }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), 'public', 'outputs', responseData.filePath.split('/').pop());

    // Save to database
    const media = await prisma.generatedMedia.create({
      data: {
        name: responseData.filePath.split('/').pop(),
        type: 'video',
        filePath: `/outputs/${responseData.filePath.split('/').pop()}`,
        thumbnailPath: `/outputs/${responseData.filePath.split('/').pop()}`, // Use video itself as thumbnail
        fileSize: responseData.fileSize ? BigInt(responseData.fileSize) : 0,
        isPaid: false
      }
    });

    return response;
  } catch (error) {
    console.error('Face fusion process failed:', error);
    return NextResponse.json({
      status: 'error',
      message: `Face fusion process failed: ${error.message}`
    }, { status: 500 });
  }
}

/**
 * Create a face fusion task by uploading source and target files
 */
async function createFusionTask(sourceFile, targetFile) {
  // Create a new FormData instance for the API request
  const apiFormData = new FormData();
  
  // Convert File objects to Buffers and add to form data
  const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());
  const targetBuffer = Buffer.from(await targetFile.arrayBuffer());
  
  apiFormData.append('source', sourceBuffer, {
    filename: sourceFile.name,
    contentType: sourceFile.type,
  });
  
  apiFormData.append('target', targetBuffer, {
    filename: targetFile.name,
    contentType: targetFile.type,
  });

  // Call the CREATE_API
  const response = await fetch(CREATE_API, {
    method: 'POST',
    body: apiFormData,
    headers: apiFormData.getHeaders && apiFormData.getHeaders(), // Only needed for node-fetch
  });

  // Check if the request was successful
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to create fusion task: ${response.status} - ${errorData.message || response.statusText}`);
  }

  // Extract the output_path from the response
  const data = await response.json();
  console.log('Create task response:', data);
  
  if (!data.output_path) {
    throw new Error('No output_path received from create task API');
  }
  
  return data.output_path;
}

/**
 * Poll the task status until it completes or fails
 */
async function pollTaskStatus(outputPath, sourceFileName) {
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Polling attempt ${retryCount + 1} for output: ${outputPath}`);
      
      // Query the task status
      const response = await fetch(QUERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ output_path: outputPath }),
      });

      // Check response status code
      const contentType = response.headers.get('content-type');
      
      // If response is JSON, it's a status update or error
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Status response:', data);
        
        // Check for specific status codes
        if (response.status === 202 || (response.status === 200 && data.status === 'processing')) {
          // Task is still processing, wait and retry
          console.log('Task is still processing, waiting for next poll...');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        } else if ([400, 404, 500].includes(response.status)) {
          // Task failed with a known error
          return NextResponse.json(data, { status: response.status });
        } else if (response.status === 200 && data.status !== 'processing') {
          // Task completed successfully with JSON response
          return NextResponse.json(data);
        } else {
          // Unknown error
          return NextResponse.json({
            status: 'error',
            message: `Unexpected status: ${response.status} - ${data.message || 'Unknown error'}`
          }, { status: response.status });
        }
      } else {
        // Non-JSON response with 200 status means the file is ready
        if (response.status === 200) {
          // Determine the file extension from content-type
          const fileExtension = getFileExtensionFromContentType(response.headers.get('content-type'));
          const name = sourceFileName.split('.')[0];
          const fileName = `${name}_${Date.now()}${fileExtension}`;
          const filePath = path.join(process.cwd(), 'public', 'outputs', fileName);
          
          // Ensure the output directory exists
          const outputDir = path.dirname(filePath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Save the file
          const fileBuffer = await response.buffer();
          fs.writeFileSync(filePath, fileBuffer);
          
          console.log(`File saved successfully at: ${filePath}`);

          // Insert into generatedMedia table
          const fileStats = fs.statSync(filePath);
          await prisma.generatedMedia.create({
            data: {
              name: fileName,
              type: 'video',
              tempPath: outputPath,
              filePath: `/outputs/${fileName}`,
              thumbnailPath: `/outputs/${fileName}`, // Use video itself as thumbnail
              fileSize: BigInt(fileStats.size)
            }
          });
          
          // Return the file path relative to public folder
          return NextResponse.json({
            status: 'success',
            message: 'Face fusion completed successfully',
            filePath: `/outputs/${fileName}`, // Path that can be used in frontend
            fileSize: fileStats.size
          });
        }
      }
      
      // Increment retry counter and wait before next poll
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      
    } catch (error) {
      console.error('Error during polling:', error);
      
      // For network errors, retry
      if (error.name === 'FetchError') {
        console.log('Network error, retrying...');
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      } else {
        // For other errors, fail the process
        return NextResponse.json({
          status: 'error',
          message: `Polling error: ${error.message}`
        }, { status: 500 });
      }
    }
  }
  
  // If we've reached maximum retries
  return NextResponse.json({
    status: 'error',
    message: `Task timed out after ${MAX_RETRIES * POLLING_INTERVAL / 1000} seconds`
  }, { status: 408 });
}

/**
 * Helper function to determine file extension from content-type
 */
function getFileExtensionFromContentType(contentType) {
  if (!contentType) return '.mp4'; // Default to mp4
  
  if (contentType.includes('video/mp4')) return '.mp4';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/jpeg')) return '.jpg';
  
  // Extract extension from content-disposition if available
  // For simplicity, we're using the default extension based on content-type
  return '.mp4';
}