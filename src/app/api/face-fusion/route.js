import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import FormData from 'form-data';
import fetch from 'node-fetch';
import prisma from '../../../lib/db';
import { serializeBigInt } from '../../../utils/serializeBigInt';

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

    // Step 1: Call CREATE_API to initiate face fusion task
    const outputPath = await createFusionTask(sourceFile, targetFile);

    console.log('Fusion task created successfully, output path:', outputPath);
    
    // Step 2: Poll QUERY_API to check task status
    const result = await pollTaskStatus(outputPath, sourceFile.name);
    
    // Enhanced error handling and logging
    if (!result) {
      console.error('No result received from face fusion task');
      return NextResponse.json({
        status: 'error',
        message: 'Face fusion task failed - no result received',
        details: { outputPath }
      }, { status: 500 });
    }

    if (result.status === 'error') {
      console.error('Face fusion task failed with error:', result);
      return NextResponse.json({
        status: 'error',
        message: result.message || 'Face fusion task failed',
        details: {
          ...result,
          outputPath,
          sourceName: sourceFile.name,
          targetName: targetFile.name
        }
      }, { status: 500 });
    }

    if (!result.filePath) {
      console.error('Invalid result from face fusion task - missing filePath:', result);
      return NextResponse.json({
        status: 'error',
        message: 'Face fusion task failed - invalid result format',
        details: {
          ...result,
          outputPath,
          sourceName: sourceFile.name,
          targetName: targetFile.name
        }
      }, { status: 500 });
    }

    const fileName = result.filePath.split('/').pop();
    const filePath = path.join(process.cwd(), 'public', 'outputs', fileName);

    // Validate fileSize exists before BigInt conversion
    if (typeof result.fileSize === 'undefined') {
      const fileStats = fs.statSync(filePath);
      result.fileSize = fileStats.size;
    }

    // Save to database with basic video info
    await prisma.generatedMedia.create({
      data: {
        name: fileName,
        type: 'video',
        filePath: `/outputs/${fileName}`,
        fileSize: BigInt(result.fileSize),
        mimeType: 'video/mp4'
      }
    });

    return serializeBigInt(result);
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
  
  try {
    // Convert File objects to Buffers and add to form data
    console.log('Processing source file:', sourceFile.name);
    const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());
    console.log('Source file size:', sourceBuffer.length);
    
    console.log('Processing target file:', targetFile.name);
    const targetBuffer = Buffer.from(await targetFile.arrayBuffer());
    console.log('Target file size:', targetBuffer.length);
    
    apiFormData.append('source', sourceBuffer, {
      filename: sourceFile.name,
      contentType: sourceFile.type,
    });
    
    apiFormData.append('target', targetBuffer, {
      filename: targetFile.name,
      contentType: targetFile.type,
    });

    // Log API endpoint
    console.log('Calling CREATE_API endpoint:', CREATE_API);

    // Call the CREATE_API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(CREATE_API, {
      method: 'POST',
      body: apiFormData,
      headers: apiFormData.getHeaders && apiFormData.getHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Check response status and content type
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('Create task API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      throw new Error(JSON.stringify({
        status: 'error',
        message: `Failed to create fusion task: ${response.status} - ${errorData.message || response.statusText}`,
        details: errorData
      }));
    }

    if (!contentType?.includes('application/json')) {
      throw new Error('Unexpected response type from create task API');
    }

    const data = await response.json();
    console.log('Create task response:', data);
    
    if (!data.output_path) {
      throw new Error('No output_path received from create task API');
    }
    
    return data.output_path;
  } catch (error) {
    console.error('Error in createFusionTask:', error);
    if (error.name === 'AbortError') {
      throw new Error('Create fusion task timed out after 30 seconds');
    }
    throw error;
  }
}

/**
 * Poll the task status until it completes or fails
 */
async function pollTaskStatus(outputPath, sourceFileName) {
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Polling attempt ${retryCount + 1} for output: ${outputPath}`);
      
      // Query the task status with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(QUERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ output_path: outputPath }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Check response status code
      const contentType = response.headers.get('content-type');
      console.log(`Poll response: ${response.status} ${response.statusText}, Content-Type: ${contentType}`);
      
      // If response is JSON, it's a status update or error
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Poll response data:', data);
        
        // Check for specific status codes
        if (response.status === 202 || (response.status === 200 && data.status === 'processing')) {
          console.log('Task is still processing, waiting for next poll...');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        }

        if ([400, 404, 500].includes(response.status)) {
          console.error('Face fusion task failed:', data);
          return {
            status: 'error',
            message: data.message || 'Face fusion processing failed',
            details: {
              ...data,
              outputPath,
              statusCode: response.status,
              retryCount
            }
          };
        }

        if (response.status === 200 && data.status === 'completed') {
          console.log('Task completed successfully:', data);
          return data;
        }

        if (response.status === 200 && data.status === 'error') {
          console.error('Task completed with error:', data);
          return {
            status: 'error',
            message: data.message || 'Face fusion processing failed',
            details: {
              ...data,
              outputPath,
              retryCount
            }
          };
        }

        // Unknown status
        console.warn('Unexpected response status:', { status: response.status, data });
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        continue;
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

          // Get file stats for size
          let thumbnailPath = null;
          if (fileExtension === '.mp4') {
            const thumbnailFileName = `${name}_${Date.now()}_thumb.jpg`;
            const thumbnailFilePath = path.join(process.cwd(), 'public', 'outputs', thumbnailFileName);
            
            // Use ffmpeg to generate thumbnail
            const ffmpeg = require('fluent-ffmpeg');
            await new Promise((resolve, reject) => {
              ffmpeg(filePath)
                .screenshots({
                  timestamps: ['00:00:01'],
                  filename: thumbnailFileName,
                  folder: path.join(process.cwd(), 'public', 'outputs'),
                  size: '320x240'
                })
                .on('end', () => {
                  thumbnailPath = `/outputs/${thumbnailFileName}`;
                  resolve();
                })
                .on('error', (err) => {
                  console.error('Error generating thumbnail:', err);
                  reject(err);
                });
            });
          }

          // Insert into generatedMedia table
          const fileStats = fs.statSync(filePath);
          await prisma.generatedMedia.create({
            data: {
              name: fileName,
              type: 'video',
              tempPath: outputPath,
              filePath: `/outputs/${fileName}`,
              thumbnailPath: thumbnailPath || `/outputs/${fileName}`, // Use video as thumbnail if thumbnail generation fails
              fileSize: BigInt(fileStats.size),
              mimeType: 'video/mp4', // Add mimeType field
            }
          });
          
          // Return the file path and size
          return {
            status: 'success',
            message: 'Face fusion completed successfully',
            filePath: `/outputs/${fileName}`,
            fileSize: fileStats.size
          };
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
        return {
          status: 'error',
          message: `Polling error: ${error.message}`,
          details: error
        };
      }
    }
  }
  
  // If we've reached maximum retries
  return {
    status: 'error',
    message: `Task timed out after ${MAX_RETRIES * POLLING_INTERVAL / 1000} seconds`
  };
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
