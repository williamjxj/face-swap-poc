import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../../../lib/db';
import { video2thumbnail, getVideoDuration } from '../../../utils/videoUtils';

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

    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const validTypes = ['video/mp4', 'video/wav', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Use original filename
    const filename = file.name;
    
    // Save file to public directory
    const publicDir = path.join(process.cwd(), 'public');
    const videosDir = path.join(publicDir, 'videos');
    const thumbnailsDir = path.join(publicDir, 'thumbnails');

    // Ensure directories exist
    try {
      await mkdir(videosDir, { recursive: true });
      await mkdir(thumbnailsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
      throw new Error('Failed to create required directories');
    }

    const filePath = path.join(videosDir, filename);
    
    try {
      // Ensure directory exists
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      console.log('File saved successfully:', filePath);
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save uploaded file');
    }

    // Generate thumbnail and get duration for video files
    let thumbnailPath = null;
    let duration = null;
    if (file.type.startsWith('video/')) {
      try {
        const thumbnailFilename = `${path.basename(filename, path.extname(filename))}_thumbnail.webp`;
        thumbnailPath = await video2thumbnail(filePath, thumbnailsDir, thumbnailFilename);
        duration = await getVideoDuration(filePath);
        console.log('Generated thumbnail and duration:', { thumbnailPath, duration });
      } catch (error) {
        console.error('Error processing video:', error);
        throw new Error('Failed to process video file');
      }
    }

    // Create database record
    if (!db) {
      console.error('Database client is not initialized');
      throw new Error('Database client not initialized');
    }

    const templateData = {
      filename: filename,
      type: file.type.startsWith('video/') ? 'video' : 
            file.type === 'image/gif' ? 'gif' : 'image',
      filePath: `/videos/${filename}`,
      thumbnailPath: thumbnailPath ? `/thumbnails/${path.basename(thumbnailPath)}` : null,
      fileSize: BigInt(file.size),
      mimeType: file.type,
      duration: duration,
    };

    console.log('Creating template record with data:', templateData);

    try {
      const template = await db.targetTemplate.create({
        data: templateData
      });

      console.log('Template created successfully:', template);

      return NextResponse.json({
        id: template.id,
        filename: template.filename,
        filePath: template.filePath,
        thumbnailPath: template.thumbnailPath,
        duration: template.duration,
        fileSize: template.fileSize.toString(),
        mimeType: template.mimeType
      });
    } catch (error) {
      console.error('Error creating database record:', error);
      throw new Error('Failed to create database record');
    }

  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload template' },
      { status: 500 }
    );
  }
}

// Add GET endpoint to list templates
export async function GET() {
  try {
    const templates = await db.targetTemplate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Add DELETE endpoint
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template details before deletion
    const template = await db.targetTemplate.findUnique({
      where: { id: id }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete files
    const publicDir = path.join(process.cwd(), 'public');
    
    // Delete video file
    if (template.filePath) {
      const videoPath = path.join(publicDir, template.filePath.slice(1));
      try {
        await unlink(videoPath);
      } catch (error) {
        console.error('Error deleting video file:', error);
      }
    }

    // Delete thumbnail file
    if (template.thumbnailPath) {
      const thumbnailPath = path.join(publicDir, template.thumbnailPath.slice(1));
      try {
        await unlink(thumbnailPath);
      } catch (error) {
        console.error('Error deleting thumbnail file:', error);
      }
    }

    // Delete database record
    await db.targetTemplate.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
} 