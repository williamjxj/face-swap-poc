import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { video2thumbnail, getVideoDuration } from '@/utils/videoHelper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/services/auth';

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
      return NextResponse.json(
        { error: 'Failed to create required directories' },
        { status: 500 }
      );
    }

    const filePath = path.join(videosDir, filename);
    
    try {
      // Save the file to the filesystem
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      console.log('File saved successfully:', filePath);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json(
        { error: 'Failed to save uploaded file' },
        { status: 500 }
      );
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
        // Continue without failing - we'll just use null values for thumbnail and duration
        console.log('Continuing upload process without thumbnail/duration');
      }
    }

    // Create database record
    if (!db) {
      console.error('Database client is not initialized');
      return NextResponse.json(
        { error: 'Database client is not initialized' },
        { status: 500 }
      );
    }
    
    console.log('Database connection check:', !!db);
    
    // Get session to associate template with user
    try {
      const session = await getServerSession(authOptions);
      console.log('Session data for template upload:', session ? 'Session exists' : 'No session');
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
    }

    // Get template type from formData or infer it from file type
    let templateType = formData.get('templateType');
    
    // If no template type is provided, infer it from file type
    if (!templateType) {
      templateType = file.type.startsWith('video/') ? 'video' : 
                    file.type === 'image/gif' ? 'gif' : 'image';
    }
    
    console.log('Template type:', templateType);
    
    // Get the user session to associate with the upload
    const session = await getServerSession(authOptions);
    let authorId = null;
    
    if (session?.user?.id) {
      authorId = session.user.id;
      console.log('Adding author ID to template:', authorId);
    } else {
      console.log('No user session for template upload, template will be anonymous');
    }
    
    const templateData = {
      filename: filename,
      type: templateType,
      filePath: `/videos/${filename}`,
      thumbnailPath: thumbnailPath ? `/thumbnails/${path.basename(thumbnailPath)}` : null,
      fileSize: BigInt(file.size),
      mimeType: file.type,
      duration: duration,
      authorId: authorId, // Add the author ID if a user is logged in
    };

    console.log('Creating template record with data:', templateData);

    try {
      console.log('Attempting to create template with data:', {
        ...templateData,
        fileSize: templateData.fileSize.toString() // Convert BigInt to string for logging
      });
      
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
      console.error('Error creating database record:', error.message);
      console.error('Error stack:', error.stack);
      
      // Return a meaningful error response instead of throwing
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error uploading template:', error);
    console.error('Error stack:', error.stack);
    
    // Create a detailed error message
    const errorMessage = error.message || 'Failed to upload template';
    const errorDetails = error.code ? ` (Code: ${error.code})` : '';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
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