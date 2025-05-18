import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client'; // Import PrismaClient directly
import { serializeBigInt } from '@/utils/helper';

// Create a direct Prisma client instance just for this route
// This avoids triggering any middleware or global Prisma operations
const prisma = new PrismaClient({
  log: ['error'], // Minimize logging
});

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
      console.log('[API] Received JSON request with paths:', { source, target });
      
      // Read files from public directory
      const publicDir = path.join(process.cwd(), 'public');
      
      // Normalize paths
      const sourcePathWithoutLeadingSlash = source.startsWith('/') ? source.substring(1) : source;
      const targetPathWithoutLeadingSlash = target.startsWith('/') ? target.substring(1) : target;
      
      const sourcePath = path.join(publicDir, sourcePathWithoutLeadingSlash);
      const targetPath = path.join(publicDir, targetPathWithoutLeadingSlash);
      
      // Validate file existence
      if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
        return NextResponse.json({
          status: 'error',
          message: 'Source or target file not found'
        }, { status: 404 });
      }

      // Create file-like objects
      sourceFile = {
        name: path.basename(sourcePathWithoutLeadingSlash),
        type: sourcePathWithoutLeadingSlash.endsWith('.png') ? 'image/png' : 'image/jpeg',
        buffer: fs.readFileSync(sourcePath),
        path: sourcePath
      };

      targetFile = {
        name: path.basename(targetPathWithoutLeadingSlash),
        type: targetPathWithoutLeadingSlash.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg',
        buffer: fs.readFileSync(targetPath),
        path: targetPath
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

    console.log('[API] Processing files:', sourceFile.name, targetFile.name);

    // Step 1: Create face fusion task
    const outputPath = await createFusionTask(sourceFile, targetFile);
    console.log('[API] Fusion task created with output path:', outputPath);
    
    // Step 2: Poll for results and handle the completed task
    const result = await pollAndProcessResult(outputPath, sourceFile, targetFile);
    
    // Return the result to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API ERROR] Face fusion process failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'An error occurred during processing'
    }, { status: 500 });
  }
}

/**
 * Create a face fusion task by uploading source and target files
 */
async function createFusionTask(sourceFile, targetFile) {
  try {
    console.log('[CREATE] Creating fusion task with source and target files');
    // Create a new FormData instance for the API request
    const apiFormData = new FormData();
    
    // Add files to form data
    apiFormData.append('source', sourceFile.buffer, {
      filename: sourceFile.name,
      contentType: sourceFile.type || 'image/jpeg'
    });
    
    apiFormData.append('target', targetFile.buffer, {
      filename: targetFile.name,
      contentType: targetFile.type || 'image/jpeg'
    });
    
    console.log('[CREATE] Sending request to API:', CREATE_API);

    // Call the CREATE_API
    const response = await fetch(CREATE_API, {
      method: 'POST',
      body: apiFormData,
      headers: apiFormData.getHeaders && apiFormData.getHeaders()
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CREATE ERROR] API error:', errorText);
      throw new Error(`Failed to create fusion task: ${response.status} - ${errorText}`);
    }

    // Extract the output_path from the response
    const data = await response.json();
    console.log('[CREATE] Task created successfully. Response:', data);
    
    if (!data.output_path) {
      throw new Error('No output_path received from create task API');
    }
    
    return data.output_path;
  } catch (error) {
    console.error('[CREATE ERROR] Error creating fusion task:', error);
    throw error;
  }
}

// saveResultToDatabase function has been replaced by functionality in pollAndProcessResult

// pollForResults function has been replaced by functionality in pollAndProcessResult

/**
 * Poll for results and process them - handles polling, downloading, saving to database
 * @param {string} outputPath - The path to the generated media from create API
 * @param {object} sourceFile - The source file object
 * @param {object} targetFile - The target file object
 * @returns {Promise<object>} - Response object with status and file information
 */
async function pollAndProcessResult(outputPath, sourceFile, targetFile) {
  let retryCount = 0;
  
  console.log(`[POLL] Starting to poll for results with outputPath: ${outputPath}`);
  console.log(`[POLL] Using QUERY_API endpoint: ${QUERY_API}`);
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[POLL] Attempt ${retryCount + 1}/${MAX_RETRIES}: Querying API with output_path: ${outputPath}`);
      
      // Make the API request to check status
      const response = await fetch(QUERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ output_path: outputPath })
      });
      
      console.log(`[POLL] API Response received - Status: ${response.status} ${response.statusText}`);
      
      // Check response content type
      const contentType = response.headers.get('content-type');
      
      // If response is JSON, it's a status update or error
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('[POLL] Parsed JSON response:', data);
        
        if (data.status === 'processing' || data.status === 'pending') {
          // Still processing, wait and retry
          console.log(`[POLL] Task still ${data.status}, waiting before next poll...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        } else if (data.status === 'completed') {
          // Task completed with a JSON response containing output_url
          console.log('[POLL] Task completed successfully with URL in response:', data);
          
          // Start download process with the output_url from the response
          const outputUrl = data.output_url || outputPath;
          return await processCompletedTask(outputUrl, sourceFile, targetFile, outputPath);
        } else if (data.status === 'failed') {
          // Task failed with an error
          console.error('[POLL] Task failed:', data.error || 'Unknown error');
          return {
            status: 'error',
            message: data.error || 'Task processing failed'
          };
        } else {
          // Unknown status
          console.warn(`[POLL] Unknown task status: ${data.status}`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        }
      } else if (response.status === 200) {
        // Non-JSON response with 200 status means the file is ready
        console.log('[POLL] Received direct binary response - file is ready');
        
        // Generate filename
        const fileExtension = getFileExtensionFromContentType(contentType);
        const outputFilename = `${path.parse(sourceFile.name).name}_${Date.now()}${fileExtension}`;
        
        // Ensure outputs directory exists
        const outputsDir = path.join(process.cwd(), 'public', 'outputs');
        if (!fs.existsSync(outputsDir)){
          fs.mkdirSync(outputsDir, { recursive: true });
        }
        
        // File path for saving
        const filePath = path.join(outputsDir, outputFilename);
        
        // Get file data
        const fileData = await response.arrayBuffer();
        const fileBuffer = Buffer.from(fileData);
        const fileSize = fileBuffer.length;
        
        // Write file to disk
        fs.writeFileSync(filePath, fileBuffer);
        console.log(`[POLL] File saved successfully at: ${filePath}`);
        
        // Verify file exists
        if (!fs.existsSync(filePath)) {
          throw new Error(`Failed to save file to ${filePath}`);
        }
        
        // Extract file extension from target file
        const fileType = targetFile.name.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
        
        // Try to extract IDs from file paths
        let faceSourceId = null;
        let templateId = null;
        
        // Extract source face ID if it exists in path
        if (sourceFile.path) {
          const sourcePathMatch = sourceFile.path.match(/\/sources\/([a-f0-9-]+)/i);
          if (sourcePathMatch && sourcePathMatch[1]) {
            try {
              const faceSource = await prisma.faceSource.findUnique({
                where: { id: sourcePathMatch[1] },
                select: { id: true }
              });
              if (faceSource) {
                faceSourceId = faceSource.id;
              }
            } catch (err) {
              console.error('[DB ERROR] Error looking up face source:', err.message);
            }
          }
        }
        
        // Extract template ID if it exists in path
        if (targetFile.path) {
          const targetPathMatch = targetFile.path.match(/\/templates\/([a-f0-9-]+)/i);
          if (targetPathMatch && targetPathMatch[1]) {
            try {
              const template = await prisma.targetTemplate.findUnique({
                where: { id: targetPathMatch[1] },
                select: { id: true }
              });
              if (template) {
                templateId = template.id;
              }
            } catch (err) {
              console.error('[DB ERROR] Error looking up template:', err.message);
            }
          }
        }
        
        // Create database record
        const dbRecord = await prisma.generatedMedia.create({
          data: {
            name: outputFilename,
            type: fileType,
            tempPath: outputPath,
            filePath: `/outputs/${outputFilename}`,
            thumbnailPath: null,
            fileSize: BigInt(fileSize),
            mimeType: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
            isPaid: false,
            faceSourceId: faceSourceId,
            templateId: templateId
          }
        });
        
        console.log('[DB] Database record created:', serializeBigInt(dbRecord));
        
        // Return success response
        return {
          status: 'success',
          message: 'Face fusion completed successfully',
          filePath: `/outputs/${outputFilename}`,
          fileSize: Number(fileSize),
          id: dbRecord.id
        };
      } else {
        // Unexpected response status
        console.warn(`[POLL] Unexpected response status: ${response.status}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
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
          message: `Polling error: ${error.message}`
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
 * Process a completed task by downloading and saving the generated media
 */
async function processCompletedTask(outputUrl, sourceFile, targetFile, outputPath) {
  try {
    // Create full URL if needed
    const fullUrl = outputUrl.startsWith('http') ? 
      outputUrl : 
      `${QUERY_API}?output_path=${encodeURIComponent(outputUrl)}`;
    
    console.log(`[DOWNLOAD] Using full URL: ${fullUrl}`);
    
    // Download the file
    const response = await fetch(fullUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    
    // Extract file extension from content type
    const contentType = response.headers.get('content-type');
    const fileExtension = getFileExtensionFromContentType(contentType);
    
    // Generate filename based on source file
    const outputFilename = `${path.parse(sourceFile.name).name}_${Date.now()}${fileExtension}`;
    
    // Ensure outputs directory exists
    const outputsDir = path.join(process.cwd(), 'public', 'outputs');
    if (!fs.existsSync(outputsDir)){
      fs.mkdirSync(outputsDir, { recursive: true });
    }
    
    // File path for saving
    const filePath = path.join(outputsDir, outputFilename);
    
    // Get file data
    const fileData = await response.arrayBuffer();
    const fileBuffer = Buffer.from(fileData);
    const fileSize = fileBuffer.length;
    
    // Write file to disk
    fs.writeFileSync(filePath, fileBuffer);
    console.log(`[DOWNLOAD] File saved successfully at: ${filePath}`);
    
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Failed to save file to ${filePath}`);
    }
    
    // Determine file type
    const fileType = targetFile.name.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
    
    // Try to extract IDs from file paths
    let faceSourceId = null;
    let templateId = null;
    
    // Extract source face ID if it exists in path
    if (sourceFile.path) {
      const sourcePathMatch = sourceFile.path.match(/\/sources\/([a-f0-9-]+)/i);
      if (sourcePathMatch && sourcePathMatch[1]) {
        try {
          const faceSource = await prisma.faceSource.findUnique({
            where: { id: sourcePathMatch[1] },
            select: { id: true }
          });
          if (faceSource) {
            faceSourceId = faceSource.id;
          }
        } catch (err) {
          console.error('[DB ERROR] Error looking up face source:', err.message);
        }
      }
    }
    
    // Extract template ID if it exists in path
    if (targetFile.path) {
      const targetPathMatch = targetFile.path.match(/\/templates\/([a-f0-9-]+)/i);
      if (targetPathMatch && targetPathMatch[1]) {
        try {
          const template = await prisma.targetTemplate.findUnique({
            where: { id: targetPathMatch[1] },
            select: { id: true }
          });
          if (template) {
            templateId = template.id;
          }
        } catch (err) {
          console.error('[DB ERROR] Error looking up template:', err.message);
        }
      }
    }
    
    // Create database record
    const dbRecord = await prisma.generatedMedia.create({
      data: {
        name: outputFilename,
        type: fileType,
        tempPath: outputPath,
        filePath: `/outputs/${outputFilename}`,
        thumbnailPath: null,
        fileSize: BigInt(fileSize),
        mimeType: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
        isPaid: false,
        faceSourceId: faceSourceId,
        templateId: templateId
      }
    });
    
    console.log('[DB] Database record created:', serializeBigInt(dbRecord));
    
    // Return success response
    return {
      status: 'success',
      message: 'Face fusion completed successfully',
      filePath: `/outputs/${outputFilename}`,
      fileSize: Number(fileSize),
      id: dbRecord.id
    };
  } catch (error) {
    console.error('[DOWNLOAD ERROR] Error processing completed task:', error);
    return {
      status: 'error',
      message: `Error processing completed task: ${error.message}`
    };
  }
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

// downloadAndSaveGeneratedMedia function has been replaced by functionality in pollAndProcessResult
// and processCompletedTask
