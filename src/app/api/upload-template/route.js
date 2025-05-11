import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    
    // Save video file
    const videoPath = join(process.cwd(), 'public', 'videos', filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(videoPath, buffer);

    // TODO: Generate thumbnail from video
    // For now, use a placeholder thumbnail
    const thumbnailPath = '/thumbnails/placeholder.webp';

    // Create template record in database
    const template = await prisma.targetTemplate.create({
      data: {
        filename: file.name,
        type: 'video',
        filePath: `/videos/${filename}`,
        thumbnailPath,
        fileSize: BigInt(file.size),
        mimeType: file.type,
      }
    });

    return NextResponse.json({
      id: template.id,
      filePath: template.filePath,
      thumbnailPath: template.thumbnailPath,
      duration: template.duration,
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json(
      { error: 'Error uploading template' },
      { status: 500 }
    );
  }
} 