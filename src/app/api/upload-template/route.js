import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../../../lib/db';
import { video2thumbnail } from '../../../utils/videoUtils';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/wav', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;
    
    // Save file to public directory
    const publicDir = path.join(process.cwd(), 'public');
    const videosDir = path.join(publicDir, 'videos');
    const filePath = path.join(videosDir, filename);
    
    // Ensure directory exists
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Generate thumbnail for video files
    let thumbnailPath = null;
    if (file.type.startsWith('video/')) {
      const thumbnailsDir = path.join(publicDir, 'thumbnails');
      thumbnailPath = await video2thumbnail(filePath, thumbnailsDir);
    }

    // Create database record
    if (!db) {
      console.error('Database client is not initialized');
      throw new Error('Database client not initialized');
    }

    console.log('Creating template record with data:', {
      filename,
      type: file.type.startsWith('video/') ? 'video' : 
            file.type === 'image/gif' ? 'gif' : 'image',
      filePath: `/videos/${filename}`,
      thumbnailPath: thumbnailPath ? `/thumbnails/${path.basename(thumbnailPath)}` : null,
      fileSize: BigInt(file.size),
      mimeType: file.type,
    });

    const template = await db.targetTemplate.create({
      data: {
        filename: filename,
        type: file.type.startsWith('video/') ? 'video' : 
              file.type === 'image/gif' ? 'gif' : 'image',
        filePath: `/videos/${filename}`,
        thumbnailPath: thumbnailPath ? `/thumbnails/${path.basename(thumbnailPath)}` : null,
        fileSize: BigInt(file.size),
        mimeType: file.type,
      }
    });

    return NextResponse.json({
      id: template.id,
      filePath: template.filePath,
      thumbnailPath: template.thumbnailPath,
      duration: template.duration
    });

  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload template' },
      { status: 500 }
    );
  }
} 