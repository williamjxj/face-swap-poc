import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import FormData from 'form-data';
import fetch from 'node-fetch';
import prisma from '@/lib/db';
import { serializeBigInt } from '@/utils/helper';

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

      // Prepare files
      sourceFile = {
        name: path.basename(sourcePath),
        path: sourcePath,
        buffer: fs.readFileSync(sourcePath)
      };
      
      targetFile = {
        name: path.basename(targetPath),
        path: targetPath,
        buffer: fs.readFileSync(targetPath)
      };
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data
      const formData = await request.formData();
      
      // Get source and target files from form data
      const sourceFormFile = formData.get('source');
      const targetFormFile = formData.get('target');
      
      if (!sourceFormFile || !targetFormFile) {
        return NextResponse.json({
          status: 'error',
          message: 'Source and target files are required'
        }, { status: 400 });
      }
      
      // Process source file
      sourceFile = {
        name: sourceFormFile.name,
        type: sourceFormFile.type,
        buffer: Buffer.from(await sourceFormFile.arrayBuffer())
      };
      
      // Process target file
      targetFile = {
        name: targetFormFile.name,
        type: targetFormFile.type,
        buffer: Buffer.from(await targetFormFile.arrayBuffer())
      };
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Unsupported content type'
      }, { status: 400 });
    }

    console.log('Processing source file, target file:', sourceFile.name, targetFile.name);

    // Send the files to the face swap API
    const result = await processFaceSwap(sourceFile, targetFile);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in face-fusion API:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'An error occurred during processing',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Process the face swap operation by sending source and target images to the API
 */
async function processFaceSwap(sourceFile, targetFile) {
  try {
    // 1. Create a new face swap task
    console.log('Creating face swap task...');
    const taskId = await createFaceSwapTask(sourceFile, targetFile);
    
    if (!taskId) {
      return { 
        status: 'error',
        message: 'Failed to create face swap task'
      };
    }
    
    console.log('Face swap task created with ID:', taskId);
    
    // 2. Poll for results
    console.log('Polling for results...');
    const result = await pollForResults(taskId);
    
    if (result.status === 'error') {
      return result;
    }
    
    // 3. Save the result to database
    console.log('Saving result to database...');
    const savedResult = await saveResultToDatabase(
      sourceFile, 
      targetFile, 
      result.output_url
    );
    
    // 4. Return the final result
    return {
      status: 'success',
      task_id: taskId,
      ...result,
      saved_result: serializeBigInt(savedResult)
    };
  } catch (error) {
    console.error('Error in processFaceSwap:', error);
    return {
      status: 'error',
      message: error.message || 'An error occurred during face swap processing'
    };
  }
}

/**
 * Create a new face swap task by sending source and target images to the API
 */
async function createFaceSwapTask(sourceFile, targetFile) {
  try {
    // Prepare form data for the API request
    const formData = new FormData();
    formData.append('source_image', sourceFile.buffer, {
      filename: sourceFile.name,
      contentType: sourceFile.type || 'image/jpeg'
    });
    formData.append('target_image', targetFile.buffer, {
      filename: targetFile.name,
      contentType: targetFile.type || 'image/jpeg' 
    });
    
    // Make the API request
    const response = await fetch(CREATE_API, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    // Parse the response to get the task ID
    const data = await response.json();
    return data.task_id;
  } catch (error) {
    console.error('Error creating face swap task:', error);
    throw error;
  }
}

/**
 * Save the processing result to the database
 */
async function saveResultToDatabase(sourceFile, targetFile, outputUrl) {
  try {
    // Create a new record in the database
    const result = await prisma.faceSwap.create({
      data: {
        sourceFileName: sourceFile.name,
        targetFileName: targetFile.name,
        outputUrl: outputUrl,
        status: 'completed'
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
}

/**
 * Poll for results using the task ID
 */
async function pollForResults(taskId) {
  // Initialize retry counter
  let retryCount = 0;
  
  // Poll until we get a result or reach max retries
  while (retryCount < MAX_RETRIES) {
    try {
      // Make the API request to check status
      const response = await fetch(`${QUERY_API}?task_id=${taskId}`, {
        method: 'GET'
      });
      
      // Check for successful response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${retryCount + 1}/${MAX_RETRIES}):`, errorText);
        
        // If we get a server error, wait and retry
        if (response.status >= 500) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        }
        
        // For client errors, stop polling
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check task status
      if (data.status === 'completed') {
        console.log('Task completed successfully!');
        return data;
      } else if (data.status === 'failed') {
        console.error('Task failed:', data.error || 'Unknown error');
        return {
          status: 'error',
          message: data.error || 'Task processing failed',
          details: data
        };
      } else if (data.status === 'processing' || data.status === 'pending') {
        // Task is still processing, wait and retry
        console.log(`Task status (${retryCount + 1}/${MAX_RETRIES}): ${data.status}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      } else {
        // Unknown status
        console.error('Unknown task status:', data.status);
        return {
          status: 'error',
          message: `Unknown task status: ${data.status}`,
          details: data
        };
      }
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
