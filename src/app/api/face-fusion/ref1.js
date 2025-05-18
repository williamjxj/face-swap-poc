import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient directly
import { serializeBigInt } from '@/utils/helper';

// Create a direct Prisma client instance just for this route
// This avoids triggering any middleware or global Prisma operations
const prisma = new PrismaClient({
  log: ['error'], // Minimize logging
});

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
      console.log('Received JSON request with paths:', { source, target });
      
      // Read files from public directory
      const publicDir = path.join(process.cwd(), 'public');
      
      // Normalize paths - ensure they start with a slash but don't have multiple slashes
      const normalizedSource = source.startsWith('/') ? source : `/${source}`;
      const normalizedTarget = target.startsWith('/') ? target : `/${target}`;
      
      // Remove any leading slash for path.join
      const sourcePathWithoutLeadingSlash = normalizedSource.replace(/^\/+/, '');
      const targetPathWithoutLeadingSlash = normalizedTarget.replace(/^\/+/, '');
      
      const sourcePath = path.join(publicDir, sourcePathWithoutLeadingSlash);
      const targetPath = path.join(publicDir, targetPathWithoutLeadingSlash);
      
      console.log('Resolved file paths:', { 
        sourcePath, 
        targetPath,
        publicDir,
        cwd: process.cwd()
      });

      // Validate file existence
      if (!fs.existsSync(sourcePath)) {
        console.error('Source file not found:', sourcePath);
        return NextResponse.json({
          status: 'error',
          message: `Source file not found: ${sourcePath}`
        }, { status: 404 });
      }
      
      if (!fs.existsSync(targetPath)) {
        console.error('Target file not found:', targetPath);
        return NextResponse.json({
          status: 'error',
          message: `Target file not found: ${targetPath}`
        }, { status: 404 });
      }

      // Prepare files
      const sourceExt = path.extname(sourcePath).toLowerCase();
      const targetExt = path.extname(targetPath).toLowerCase();
      
      // Determine MIME types based on file extensions
      const sourceMimeType = getMimeTypeFromExtension(sourceExt);
      const targetMimeType = getMimeTypeFromExtension(targetExt);
      
      sourceFile = {
        name: path.basename(sourcePath),
        path: sourcePath,
        buffer: fs.readFileSync(sourcePath),
        type: sourceMimeType
      };
      
      targetFile = {
        name: path.basename(targetPath),
        path: targetPath,
        buffer: fs.readFileSync(targetPath),
        type: targetMimeType
      };
      
      console.log('Prepared source file:', {
        name: sourceFile.name,
        type: sourceFile.type,
        size: sourceFile.buffer.length
      });
      
      console.log('Prepared target file:', {
        name: targetFile.name,
        type: targetFile.type,
        size: targetFile.buffer.length
      });
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
    console.log('[PROCESS] ========== Starting Face Swap Process ==========');
    // 1. Create a new face swap task
    console.log('[PROCESS] Step 1: Creating face swap task...');
    console.log('[PROCESS] Source file type:', sourceFile.type, 'name:', sourceFile.name, 'size:', sourceFile.buffer?.length || 'unknown');
    console.log('[PROCESS] Target file type:', targetFile.type, 'name:', targetFile.name, 'size:', targetFile.buffer?.length || 'unknown');
    
    const outputPath = await createFaceSwapTask(sourceFile, targetFile);
    
    if (!outputPath) {
      console.error('[PROCESS ERROR] No output path returned from createFaceSwapTask');
      return { 
        status: 'error',
        message: 'Failed to create face swap task'
      };
    }
    
    // Use the exact outputPath from the API without any modification
    console.log('[PROCESS] Face swap task created successfully with output path:', outputPath);
    
    // 2. Poll for results using the output_path
    console.log('[PROCESS] Step 2: Polling for results...');
    const result = await pollForResults(outputPath);
    
    // Ensure we have a valid result object
    if (!result) {
      console.error('[PROCESS ERROR] No result returned from polling');
      return {
        status: 'error',
        message: 'No result returned from polling'
      };
    }
    
    if (result.status === 'error') {
      console.error('[PROCESS ERROR] Polling returned error status:', result.message || 'Unknown error');
      return result;
    }
    
    // Determine the final output URL to use
    // The API might return the file directly or provide URLs in different formats
    const finalOutputUrl = result.output_url || result.url || outputPath;
    
    // Log what we got back
    console.log('[PROCESS] Polling complete, result:', {
      status: result.status,
      output_url: finalOutputUrl,
      hasMessage: !!result.message,
      isDirectMediaResponse: !!result.isDirectMediaResponse
    });
    
    // 3. Save the result to database
    console.log('[PROCESS] Step 3: Saving result to database...');
    try {
      const savedResult = await saveResultToDatabase(
        sourceFile, 
        targetFile, 
        finalOutputUrl, // Use the determined final output URL
        outputPath  // Store original outputPath in tempPath field
      );
      
      console.log('[PROCESS] Database save completed successfully. Result ID:', savedResult.id);
      
      // 4. Return the final result
      console.log('[PROCESS] Step 4: Returning final result to client');
      console.log('[PROCESS] ========== Face Swap Process Complete ==========');
      
      return {
        status: 'success',
        output_path: outputPath, // Original output path from create task
        output_url: finalOutputUrl, // Final URL determined during polling
        ...result,
        saved_result: serializeBigInt(savedResult),
        file: savedResult.name, // Add file name to match expected response format
        id: savedResult.id      // Include the generated ID
      };
    } catch (dbError) {
      console.error('[PROCESS ERROR] Failed to save result to database:', dbError);
      // If database operation fails, return an error with as much info as possible
      return {
        status: 'error',
        message: `Failed to save to database: ${dbError.message}`,
        output_path: outputPath,
        output_url: finalOutputUrl,
        apiResult: result,
        error_details: dbError.toString()
      };
    }
  } catch (error) {
    console.error('[PROCESS ERROR] Error in processFaceSwap:', error);
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
    
    // Log what we're sending to help debug
    console.log('Sending source file:', {
      name: sourceFile.name,
      type: sourceFile.type,
      bufferLength: sourceFile.buffer?.length || 'undefined'
    });
    console.log('Sending target file:', {
      name: targetFile.name,
      type: targetFile.type,
      bufferLength: targetFile.buffer?.length || 'undefined'
    });
    
    formData.append('source', sourceFile.buffer, {
      filename: sourceFile.name,
      contentType: sourceFile.type || 'image/jpeg'
    });
    formData.append('target', targetFile.buffer, {
      filename: targetFile.name,
      contentType: targetFile.type || 'image/jpeg' 
    });
    
    // Log the API endpoint for debugging
    console.log('Sending request to API endpoint:', CREATE_API);
    
    // Make the API request
    const response = await fetch(CREATE_API, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // Log the full response for debugging
    console.log('API Response Status:', response.status, response.statusText);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    // Parse the response to get the task ID
    const data = await response.json();
    
    console.log('createFaceSwapTask response:', data);
    
    // Check for output_path in the response
    if (!data.output_path) {
      console.error('No output_path found in API response:', data);
      throw new Error('Failed to get output_path from API response');
    }

    return data.output_path;
  } catch (error) {
    console.error('Error creating face swap task:', error);
    throw error;
  }
}

/**
 * Save the processing result to the database
 */
async function saveResultToDatabase(sourceFile, targetFile, outputUrl, outputPath) {
  try {
    console.log('[DB] ========== Starting Database Operation ==========');
    console.log('[DB] Preparing to save result to database with outputUrl:', outputUrl);
    console.log('[DB] Original outputPath:', outputPath);
    
    // Extract file extension from target file
    const fileExtension = path.extname(targetFile.name);
    // Generate a unique filename based on the source name
    const outputFilename = `${path.parse(sourceFile.name).name}_${Date.now()}${fileExtension}`;
    console.log(`[DB] Generated output filename: ${outputFilename}`);
    
    // Determine file type (video or image)
    const fileType = targetFile.name.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
    console.log(`[DB] Determined file type: ${fileType}`);
    
    // For this version, thumbnailPath can be null as requested
    const thumbnailPath = null;
    
    // Try to extract IDs from file paths
    console.log('[DB] Attempting to extract IDs from file paths');
    console.log(`[DB] Source path: ${sourceFile.path || 'undefined'}`);
    console.log(`[DB] Target path: ${targetFile.path || 'undefined'}`);
    
    // Assuming paths might contain IDs like /sources/{id}/ or template paths with IDs
    let faceSourceId = null;
    let templateId = null;
    
    // Extract source face ID if it exists in a standard path format
    const sourcePathMatch = sourceFile.path?.match(/\/sources\/([a-f0-9-]+)/i); // Adjusted regex for potential subfolders in path
    if (sourcePathMatch && sourcePathMatch[1]) {
      const potentialId = sourcePathMatch[1];
      console.log(`[DB] Found potential face source ID in path: ${potentialId}`);
      try {
        // Check if this ID exists in the database
        console.log(`[DB] Checking if face source ID ${potentialId} exists in database`);
        const faceSource = await prisma.faceSource.findUnique({
          where: { id: potentialId },
          select: { id: true }
        });
        if (faceSource) {
          faceSourceId = faceSource.id;
          console.log(`[DB] Successfully found face source with ID: ${faceSourceId}`);
        } else {
          console.log(`[DB] No face source found with ID: ${potentialId}`);
        }
      } catch (err) {
        console.error('[DB ERROR] Error looking up face source:', err.message);
      }
    } else {
      console.log('[DB] No face source ID pattern found in path');
    }
    
    // Extract template ID if it exists in a standard path format
    const targetPathMatch = targetFile.path?.match(/\/templates\/([a-f0-9-]+)/i); // Adjusted regex for potential subfolders in path
    if (targetPathMatch && targetPathMatch[1]) {
      const potentialId = targetPathMatch[1];
      console.log(`[DB] Found potential template ID in path: ${potentialId}`);
      try {
        // Check if this ID exists in the database
        console.log(`[DB] Checking if template ID ${potentialId} exists in database`);
        const template = await prisma.targetTemplate.findUnique({
          where: { id: potentialId },
          select: { id: true }
        });
        if (template) {
          templateId = template.id;
          console.log(`[DB] Successfully found template with ID: ${templateId}`);
        } else {
          console.log(`[DB] No template found with ID: ${potentialId}`);
        }
      } catch (err) {
        console.error('[DB ERROR] Error looking up template:', err.message);
      }
    } else {
      console.log('[DB] No template ID pattern found in path');
    }
    
    // Download and save the generated media file
    console.log('[DB] Starting download and save of generated media file');
    let filePath; // No default assignment
    let fileSize; // No default assignment
    
    try {
      console.log('[DB] Calling downloadAndSaveGeneratedMedia...');
      const savedFile = await downloadAndSaveGeneratedMedia(outputUrl, outputFilename, fileType);
      filePath = savedFile.filePath;
      fileSize = BigInt(savedFile.fileSize); // Ensure this is BigInt
      console.log(`[DB] Media download successful. Path: ${filePath}, Size: ${fileSize} bytes`);
    } catch (downloadError) {
      console.error('[DB ERROR] Failed to download generated media:', downloadError);
      // Propagate the error to prevent DB insertion with incorrect data
      throw new Error(`Failed to download and save generated media: ${downloadError.message}`);
    }

    // Create a DB insert payload
    console.log('[DB] Preparing database insert payload');
    const insertData = {
      name: outputFilename,
      type: fileType,
      tempPath: outputPath, // Store the output path in tempPath
      filePath: filePath,
      thumbnailPath: thumbnailPath,
      fileSize: fileSize, // Now updated with the actual file size
      mimeType: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
      isPaid: false, // Default to unpaid
      faceSourceId: faceSourceId,
      templateId: templateId,
      // Explicitly not including authorId to avoid User table operations
    };
    
    console.log('[DB] Database insert payload prepared:', JSON.stringify(insertData, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value 
    ));

    // Create a new record in the GeneratedMedia table
    console.log('[DB] Executing database insert operation...');
    
    // Execute the insert directly with prisma.generatedMedia
    const result = await prisma.generatedMedia.create({
      data: insertData
    });
    
    console.log('[DB] Database insert successful!');
    console.log('[DB] Generated media record:', JSON.stringify(
      serializeBigInt(result), 
      null, 
      2
    ));
    console.log(`[DB] New record ID: ${result.id}`);
    console.log('[DB] ========== Database Operation Complete ==========');
    
    return result;
  } catch (error) {
    console.error('[DB ERROR] Error saving to database:', error);
    throw error;
  }
}

/**
 * Poll for results using the output path
 */
async function pollForResults(outputPath) {
  // Initialize retry counter
  let retryCount = 0;
  
  console.log(`[POLL] Starting to poll for results with outputPath: ${outputPath}`);
  console.log(`[POLL] Using QUERY_API endpoint: ${QUERY_API}`);
  console.log(`[POLL] Will try up to ${MAX_RETRIES} times with ${POLLING_INTERVAL/1000} seconds between attempts`);
  
  // Poll until we get a result or reach max retries
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[POLL] Attempt ${retryCount + 1}/${MAX_RETRIES}: Querying API with output_path: ${outputPath}`);
      
      // Make the API request to check status - using POST instead of GET
      const response = await fetch(QUERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ output_path: outputPath })
      });
      
      console.log(`[POLL] API Response received - Status: ${response.status} ${response.statusText}`);
      console.log(`[POLL] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Check for successful response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[POLL ERROR] API error (${retryCount + 1}/${MAX_RETRIES}):`, errorText);
        
        // If we get a server error, wait and retry
        if (response.status >= 500) {
          retryCount++;
          console.log(`[POLL] Server error (${response.status}), retrying in ${POLLING_INTERVAL/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        }
        
        // For client errors like 405 Method Not Allowed, stop polling
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
      
      // Get the response content
      const contentType = response.headers.get('content-type');
      console.log(`[POLL] Response content type: ${contentType || 'not specified'}`);
      
      // Success status code 200 - now check content
      console.log(`[POLL SUCCESS] Response received with status 200 OK`);
      
      // First check if this might be a media file response
      if (!contentType || !contentType.includes('application/json')) {
        try {
          // Clone the response so we can examine it without consuming it
          const clonedResponse = response.clone();
          // Read the first few bytes to check if it's a binary file
          const buffer = await clonedResponse.arrayBuffer();
          const firstBytes = new Uint8Array(buffer.slice(0, 16));
          const firstBytesHex = Array.from(firstBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          console.log('[POLL] Response first bytes:', firstBytesHex);
          
          // Check for common media file signatures
          // MP4: ftyp (66 74 79 70)
          // JPEG: ffd8 ff
          if (firstBytesHex.includes('66747970') || // 'ftyp' in hex
              firstBytesHex.includes('ffd8ff')) {   // JPEG header
            console.log('[POLL SUCCESS] Detected binary media file in response');
            
            // For debugging, log content type if available
            if (contentType) {
              console.log('[POLL] Binary response content type:', contentType);
            }
            
            // Return successful result with the output path
            console.log(`[POLL SUCCESS] Query API returned a binary file. Status 200 OK. Media response detected.`);
            return {
              status: 'completed',
              output_url: outputPath,
              message: 'Received completed media file directly',
              isDirectMediaResponse: true
            };
          }
          
          // Not recognized as binary, try to read as text for debugging
          const rawText = await response.text();
          console.log('[POLL] Non-JSON response (first 100 chars):', rawText.substring(0, 100));
          
          if (isBinaryMediaFile(rawText)) {
            console.log(`[POLL SUCCESS] Query API returned what appears to be a binary file. Status 200 OK.`);
            return {
              status: 'completed',
              output_url: outputPath,
              message: 'Received media file directly instead of status JSON'
            };
          }
          
          // Not a known format, retry polling
          retryCount++;
          console.log(`[POLL] Unrecognized response format, retrying in ${POLLING_INTERVAL/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        } catch (error) {
          console.error('[POLL ERROR] Error examining response:', error);
          // If we can't process the response, assume it might be a binary file
          console.log(`[POLL WARNING] Could not process response, assuming it might be a media file.`);
          return {
            status: 'completed',
            output_url: outputPath,
            message: 'Received unprocessable response, assuming completion'
          };
        }
      }
      
      // If we get here, we're expecting JSON
      let data;
      try {
        // Parse the response as JSON
        data = await response.json();
        console.log(`[POLL] Parsed JSON response:`, data);
      } catch (jsonError) {
        console.error('[POLL ERROR] Failed to parse JSON response:', jsonError);
        // Get a new copy of the response for debugging
        try {
          const clonedResponse = response.clone();
          const rawBody = await clonedResponse.text();
          console.log('[POLL ERROR] Failed JSON parsing (first 100 chars):', rawBody.substring(0, 100));
          
          // Last attempt to check if it's a binary file
          if (isBinaryMediaFile(rawBody)) {
            console.log('[POLL] Response appears to be a media file rather than JSON');
            return {
              status: 'completed',
              output_url: outputPath,
              message: 'Received binary data instead of JSON, assuming successful processing'
            };
          }
        } catch (e) {
          console.error('[POLL ERROR] Error reading response after JSON parse failure:', e);
        }
        
        // Retry in case of temporary issue
        retryCount++;
        console.log(`[POLL] JSON parsing error, retrying in ${POLLING_INTERVAL/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        continue;
      }
      
      // Check task status
      if (data && data.status === 'completed') {
        console.log('[POLL SUCCESS] Task completed successfully!', data);
        return data;
      } else if (data && data.status === 'failed') {
        console.error('[POLL ERROR] Task failed:', data.error || 'Unknown error');
        return {
          status: 'error',
          message: data.error || 'Task processing failed',
          details: data
        };
      } else if (data && (data.status === 'processing' || data.status === 'pending')) {
        // Task is still processing, wait and retry
        console.log(`[POLL] Task status (${retryCount + 1}/${MAX_RETRIES}): ${data.status}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      } else if (data) {
        // Unknown status
        console.error('[POLL ERROR] Unknown task status:', data.status);
        return {
          status: 'error',
          message: `Unknown task status: ${data.status}`,
          details: data
        };
      }
    } catch (error) {
      console.error('[POLL ERROR] Error during polling:', error);
      
      // For network errors, retry
      if (error.name === 'FetchError') {
        console.log('[POLL] Network error, retrying...');
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
  console.error(`[POLL ERROR] Maximum retries (${MAX_RETRIES}) reached without success`);
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

/**
 * Helper function to determine MIME type from file extension
 */
function getMimeTypeFromExtension(extension) {
  const ext = extension.toLowerCase();
  
  // Map common extensions to MIME types
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.webm':
      return 'video/webm';
    default:
      // If we can't determine the MIME type, make a guess based on the extension
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return 'image/jpeg';  // Default to JPEG for images
      }
      return 'video/mp4';  // Default to MP4 for everything else
  }
}

/**
 * Helper function to check if content is a binary media file by looking for common signatures
 */
function isBinaryMediaFile(content) {
  if (!content) return false;
  
  try {
    // Handle different content types
    let str;
    if (Buffer.isBuffer(content)) {
      str = content.toString('binary', 0, 200);
    } else if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
      str = String.fromCharCode.apply(null, new Uint8Array(content).slice(0, 200));
    } else if (typeof content === 'string') {
      str = content.substring(0, 200);
    } else {
      str = String(content).substring(0, 200);
    }
    
    // MP4/MOV file signatures (ISO media format)
    if (str.includes('ftyp') || str.includes('mdat') || str.includes('moov') || 
        str.includes('pnot') || str.includes('wide')) {
      return true;
    }
    
    // JPEG signatures
    if (str.includes('\xFF\xD8\xFF')) {
      return true;
    }
    
    // PNG signature
    if (str.includes('PNG')) {
      return true;
    }
    
    // WebM/MKV signatures
    if (str.includes('\x1A\x45\xDF\xA3') || str.includes('webm') || str.includes('matroska')) {
      return true;
    }
    
    // MP3 signatures
    if (str.includes('ID3') || str.includes('\xFF\xFB') || str.includes('\xFF\xF3') || 
        str.includes('\xFF\xF2') || str.includes('\xFF\xFA')) {
      return true;
    }
    
    // Look for non-printable characters which suggest binary content
    const nonPrintableCount = Array.from(str).filter(char => {
      const code = char.charCodeAt(0);
      return (code < 32 || code > 126) && code !== 10 && code !== 13 && code !== 9;
    }).length;
    
    // If more than 20% of the first 200 chars are non-printable, likely binary
    if (nonPrintableCount > str.length * 0.2) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for binary media file:', error);
    return false;
  }
}

/**
 * Download the generated media file from the API and save it to the outputs directory
 * @param {string} outputUrl - The URL or path to the generated media
 * @param {string} filename - The filename to save the media as
 * @param {string} fileType - The type of file (video or image)
 * @returns {Promise<{filePath: string, fileSize: number}>} The saved file path and size
 */
async function downloadAndSaveGeneratedMedia(outputUrl, filename, fileType) {
  try {
    console.log(`[DOWNLOAD] ========== Starting Media Download ==========`);
    console.log(`[DOWNLOAD] Source: ${outputUrl}`);
    console.log(`[DOWNLOAD] Target filename: ${filename}`);
    console.log(`[DOWNLOAD] File type: ${fileType}`);
    
    // Create the full URL to fetch the content from the API
    const fullUrl = outputUrl.startsWith('http') ? 
      outputUrl : 
      `${QUERY_API}?output_path=${encodeURIComponent(outputUrl)}`;
    
    console.log(`[DOWNLOAD] Using full URL: ${fullUrl}`);
    
    // Download the file from the API
    console.log(`[DOWNLOAD] Sending GET request to fetch media file...`);
    const response = await fetch(fullUrl, {
      method: 'GET',
    });
    
    console.log(`[DOWNLOAD] Response received - Status: ${response.status} ${response.statusText}`);
    console.log(`[DOWNLOAD] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error(`[DOWNLOAD ERROR] Failed to download file: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[DOWNLOAD ERROR] Error response body: ${errorText}`);
      throw new Error(`Failed to download file: ${response.status} ${errorText}`);
    }
    
    // Check content type to verify we're getting media
    const contentType = response.headers.get('content-type');
    console.log(`[DOWNLOAD] Content-Type: ${contentType || 'not specified'}`);
    
    // Get the file data as a buffer
    console.log(`[DOWNLOAD] Reading response body as array buffer...`);
    const fileData = await response.arrayBuffer();
    const buffer = Buffer.from(fileData);
    
    // Calculate file size
    const fileSize = buffer.length;
    console.log(`[DOWNLOAD] Downloaded file size: ${fileSize} bytes`);
    
    // Check if the file size is reasonable
    if (fileSize < 1000) { // Very small files are suspicious
      console.warn(`[DOWNLOAD WARNING] Downloaded file is very small (${fileSize} bytes). This might not be valid media.`);
      
      // Check the first few bytes for known signatures
      const firstBytes = new Uint8Array(buffer.slice(0, 16));
      const firstBytesHex = Array.from(firstBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      console.log(`[DOWNLOAD] First bytes: ${firstBytesHex}`);
      
      // Validate that we actually have a media file
      const isMedia = isBinaryMediaFile(buffer);
      if (!isMedia && fileSize < 50000) { // If not too large, check if it's media
        console.error(`[DOWNLOAD ERROR] Downloaded content doesn't appear to be a valid media file`);
        if (fileSize < 1000) { // Small enough to log
          console.error(`[DOWNLOAD ERROR] Content: ${buffer.toString().substring(0, 200)}`);
        }
        throw new Error(`Downloaded content doesn't appear to be a valid media file (${fileSize} bytes)`);
      }
    }
    
    // Ensure the directory exists
    const outputsDir = path.join(process.cwd(), 'public', 'outputs');
    console.log(`[DOWNLOAD] Ensuring outputs directory exists: ${outputsDir}`);
    if (!fs.existsSync(outputsDir)){
      console.log(`[DOWNLOAD] Creating outputs directory...`);
      fs.mkdirSync(outputsDir, { recursive: true });
    }
    
    // Create the output path
    const filePath = path.join(outputsDir, filename);
    console.log(`[DOWNLOAD] Will write file to: ${filePath}`);
    
    // Write the file to disk
    console.log(`[DOWNLOAD] Writing ${fileSize} bytes to file...`);
    fs.writeFileSync(filePath, buffer);
    
    // Verify the file was created
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`[DOWNLOAD SUCCESS] File saved successfully. Size on disk: ${stats.size} bytes`);
      
      if (stats.size !== fileSize) {
        console.warn(`[DOWNLOAD WARNING] File size mismatch. Expected: ${fileSize}, Actual: ${stats.size}`);
      }
    } else {
      console.error(`[DOWNLOAD ERROR] File was not created at ${filePath}`);
      throw new Error(`Failed to create file at ${filePath}`);
    }
    
    console.log(`[DOWNLOAD] ========== Media Download Complete ==========`);
    
    return {
      filePath: `/outputs/${filename}`,
      fileSize: fileSize,
    };
  } catch (error) {
    console.error('[DOWNLOAD ERROR] Error downloading and saving generated media:', error);
    throw error;
  }
}
